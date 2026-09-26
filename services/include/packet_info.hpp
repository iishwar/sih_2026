#pragma once

#include <cstdint>
#include <string>

struct PacketInfo {
    std::string source_ip;
    std::string destination_ip;

    std::uint16_t source_port = 0;
    std::uint16_t destination_port = 0;

    std::string protocol = "OTHER";
    std::uint32_t packet_length = 0;

    // True when this is a TCP packet with the SYN flag set.
    bool tcp_syn = false;

    // Unix timestamp in seconds, including fractional seconds.
    double timestamp = 0.0;
};