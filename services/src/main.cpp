#include "alert.hpp"
#include "flow_tracker.hpp"
#include "packet_capture.hpp"

#include <iostream>
#include <memory>
#include <string>

void print_usage(const char* program_name) {
    std::cerr
        << "Usage:\n"
        << "  " << program_name << " --pcap <file.pcap>\n"
        << "  " << program_name << " --interface <interface-name>\n\n"
        << "Alerts are written to standard output as JSON Lines.\n";
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        print_usage(argv[0]);
        return 1;
    }

    const std::string mode = argv[1];
    const std::string source = argv[2];

    auto tracker = std::make_shared<FlowTracker>(
        [](const Alert& alert) {
            std::cout << alert_to_json(alert) << '\n';
            std::cout.flush();
        }
    );

    PacketCapture capture(
        [tracker](const PacketInfo& packet) {
            tracker->process_packet(packet);
        }
    );

    bool success = false;

    if (mode == "--pcap") {
        success = capture.replay_pcap(source);
    } else if (mode == "--interface") {
        success = capture.capture_interface(source);
    } else {
        print_usage(argv[0]);
        return 1;
    }

    return success ? 0 : 1;
}