#pragma once

#include "packet_info.hpp"

#include <functional>
#include <string>

class PacketCapture {
public:
    using PacketCallback = std::function<void(const PacketInfo&)>;

    explicit PacketCapture(PacketCallback callback);

    // Replays packets from a PCAP file.
    bool replay_pcap(const std::string& file_path);

    // Passively captures packets from a network interface.
    bool capture_interface(const std::string& interface_name);

private:
    PacketCallback packet_callback_;
};