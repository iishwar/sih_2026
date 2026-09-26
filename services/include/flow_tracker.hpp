#pragma once

#include "alert.hpp"
#include "packet_info.hpp"

#include <cstddef>
#include <deque>
#include <functional>
#include <string>
#include <unordered_map>
#include <unordered_set>

class FlowTracker {
public:
    using AlertCallback = std::function<void(const Alert&)>;

    explicit FlowTracker(AlertCallback callback);

    void process_packet(const PacketInfo& packet);

private:
    struct PortObservation {
        double timestamp;
        std::uint16_t destination_port;
    };

    struct SourceState {
        std::deque<PortObservation> recent_ports;
        double last_alert_timestamp = -1.0;
    };

    static constexpr double WINDOW_SECONDS = 10.0;
    static constexpr double ALERT_COOLDOWN_SECONDS = 10.0;
    static constexpr std::size_t PORT_SCAN_THRESHOLD = 10;
    static constexpr std::size_t MAX_TRACKED_SOURCES = 10000;

    void check_for_port_scan(const PacketInfo& packet);

    AlertCallback alert_callback_;
    std::unordered_map<std::string, SourceState> sources_;
};