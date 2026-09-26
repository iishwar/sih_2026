#include "flow_tracker.hpp"

#include <iomanip>
#include <sstream>

FlowTracker::FlowTracker(AlertCallback callback)
    : alert_callback_(std::move(callback)) {}

void FlowTracker::process_packet(const PacketInfo& packet) {
    check_for_port_scan(packet);
}

void FlowTracker::check_for_port_scan(const PacketInfo& packet) {
    // This baseline rule only counts TCP SYN packets.
    if (packet.protocol != "TCP" || !packet.tcp_syn) {
        return;
    }

    // Keep the source map bounded. This simple policy evicts one entry
    // when the configured limit is reached.
    if (sources_.find(packet.source_ip) == sources_.end() &&
        sources_.size() >= MAX_TRACKED_SOURCES) {
        sources_.erase(sources_.begin());
    }

    SourceState& state = sources_[packet.source_ip];

    state.recent_ports.push_back(
        PortObservation{packet.timestamp, packet.destination_port}
    );

    // Remove observations older than the rolling window.
    while (!state.recent_ports.empty() &&
           packet.timestamp - state.recent_ports.front().timestamp >
               WINDOW_SECONDS) {
        state.recent_ports.pop_front();
    }

    std::unordered_set<std::uint16_t> unique_ports;
    for (const PortObservation& observation : state.recent_ports) {
        unique_ports.insert(observation.destination_port);
    }

    if (unique_ports.size() < PORT_SCAN_THRESHOLD) {
        return;
    }

    // Avoid emitting the same source's alert for every packet.
    if (state.last_alert_timestamp >= 0.0 &&
        packet.timestamp - state.last_alert_timestamp <
            ALERT_COOLDOWN_SECONDS) {
        return;
    }

    state.last_alert_timestamp = packet.timestamp;

    std::ostringstream evidence;
    evidence << std::fixed << std::setprecision(1)
             << "{"
             << "\"source_ip\":\"" << json_escape(packet.source_ip) << "\","
             << "\"unique_destination_ports_10s\":" << unique_ports.size() << ","
             << "\"window_seconds\":" << WINDOW_SECONDS
             << "}";

    Alert alert;
    alert.timestamp = current_utc_timestamp();
    alert.flow_id = packet.source_ip + "->" + packet.destination_ip +
                    ":TCP/" + std::to_string(packet.destination_port);
    alert.threat_class = "RECONNAISSANCE_PORT_SCAN";
    alert.confidence = 0.70;
    alert.severity = "MEDIUM";
    alert.evidence_json = evidence.str();

    if (alert_callback_) {
        alert_callback_(alert);
    }
}