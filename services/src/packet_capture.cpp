#include "packet_capture.hpp"

#include <arpa/inet.h>
#include <pcap/pcap.h>

#include <cstdint>
#include <cstring>
#include <iostream>
#include <netinet/in.h>

namespace {
constexpr std::uint16_t ETHERNET_TYPE_IPV4 = 0x0800;
constexpr std::uint16_t ETHERNET_TYPE_VLAN = 0x8100;
constexpr std::uint16_t ETHERNET_TYPE_QINQ = 0x88A8;

constexpr std::uint8_t IP_PROTOCOL_TCP = 6;
constexpr std::uint8_t IP_PROTOCOL_UDP = 17;

struct CaptureContext {
    PacketCapture::PacketCallback* callback;
};

std::uint16_t read_u16(const u_char* data) {
    std::uint16_t value = 0;
    std::memcpy(&value, data, sizeof(value));
    return ntohs(value);
}

void process_raw_packet(
    const struct pcap_pkthdr* header,
    const u_char* bytes,
    PacketCapture::PacketCallback& callback
) {
    if (header == nullptr || bytes == nullptr || header->caplen < 14) {
        return;
    }

    std::size_t offset = 14;

    // Ethernet type is at byte 12.
    std::uint16_t ether_type = read_u16(bytes + 12);

    // Handle one VLAN tag.
    if (ether_type == ETHERNET_TYPE_VLAN || ether_type == ETHERNET_TYPE_QINQ) {
        if (header->caplen < offset + 4) {
            return;
        }

        ether_type = read_u16(bytes + 16);
        offset += 4;
    }

    if (ether_type != ETHERNET_TYPE_IPV4) {
        return;
    }

    if (header->caplen < offset + 20) {
        return;
    }

    const u_char* ip = bytes + offset;
    const std::uint8_t version_and_header_length = ip[0];
    const std::uint8_t ip_version = version_and_header_length >> 4;
    const std::size_t ip_header_length =
        static_cast<std::size_t>(version_and_header_length & 0x0F) * 4;

    if (ip_version != 4 || ip_header_length < 20 ||
        header->caplen < offset + ip_header_length) {
        return;
    }

    // Ignore non-initial IPv4 fragments because their transport header
    // is not available in that packet.
    const std::uint16_t fragment_field = read_u16(ip + 6);
    if ((fragment_field & 0x1FFF) != 0) {
        return;
    }

    char source_address[INET_ADDRSTRLEN] = {};
    char destination_address[INET_ADDRSTRLEN] = {};

    if (inet_ntop(AF_INET, ip + 12, source_address, sizeof(source_address)) == nullptr ||
        inet_ntop(AF_INET, ip + 16, destination_address,
                  sizeof(destination_address)) == nullptr) {
        return;
    }

    PacketInfo packet;
    packet.source_ip = source_address;
    packet.destination_ip = destination_address;
    packet.packet_length = header->len;
    packet.timestamp =
        static_cast<double>(header->ts.tv_sec) +
        static_cast<double>(header->ts.tv_usec) / 1'000'000.0;

    const std::uint8_t ip_protocol = ip[9];
    const std::size_t transport_offset = offset + ip_header_length;

    if (ip_protocol == IP_PROTOCOL_TCP) {
        if (header->caplen < transport_offset + 20) {
            return;
        }

        const u_char* tcp = bytes + transport_offset;
        packet.protocol = "TCP";
        packet.source_port = read_u16(tcp);
        packet.destination_port = read_u16(tcp + 2);
        packet.tcp_syn = (tcp[13] & 0x02) != 0;
    } else if (ip_protocol == IP_PROTOCOL_UDP) {
        if (header->caplen < transport_offset + 8) {
            return;
        }

        const u_char* udp = bytes + transport_offset;
        packet.protocol = "UDP";
        packet.source_port = read_u16(udp);
        packet.destination_port = read_u16(udp + 2);
    } else {
        packet.protocol = "OTHER";
    }

    callback(packet);
}

void pcap_packet_callback(
    u_char* user_data,
    const struct pcap_pkthdr* header,
    const u_char* bytes
) {
    auto* context = reinterpret_cast<CaptureContext*>(user_data);
    if (context == nullptr || context->callback == nullptr) {
        return;
    }

    process_raw_packet(header, bytes, *context->callback);
}
}  // namespace

PacketCapture::PacketCapture(PacketCallback callback)
    : packet_callback_(std::move(callback)) {}

bool PacketCapture::replay_pcap(const std::string& file_path) {
    char error_buffer[PCAP_ERRBUF_SIZE] = {};
    pcap_t* handle = pcap_open_offline(file_path.c_str(), error_buffer);

    if (handle == nullptr) {
        std::cerr << "Could not open PCAP: " << error_buffer << '\n';
        return false;
    }

    if (pcap_datalink(handle) != DLT_EN10MB) {
        std::cerr << "This starter supports Ethernet PCAP files only.\n";
        pcap_close(handle);
        return false;
    }

    CaptureContext context{&packet_callback_};

    pcap_loop(
        handle,
        0,
        pcap_packet_callback,
        reinterpret_cast<u_char*>(&context)
    );

    pcap_close(handle);
    return true;
}

bool PacketCapture::capture_interface(const std::string& interface_name) {
    char error_buffer[PCAP_ERRBUF_SIZE] = {};

    // This opens a capture handle. It does not transmit packets.
    pcap_t* handle = pcap_open_live(
        interface_name.c_str(),
        65535,
        1,       // Enable promiscuous mode.
        1000,    // Capture timeout in milliseconds.
        error_buffer
    );

    if (handle == nullptr) {
        std::cerr << "Could not open interface: " << error_buffer << '\n';
        return false;
    }

    if (pcap_datalink(handle) != DLT_EN10MB) {
        std::cerr << "This starter supports Ethernet interfaces only.\n";
        pcap_close(handle);
        return false;
    }

    CaptureContext context{&packet_callback_};

    // Runs until interrupted, for example with Ctrl+C.
    const int result = pcap_loop(
        handle,
        0,
        pcap_packet_callback,
        reinterpret_cast<u_char*>(&context)
    );

    if (result == PCAP_ERROR) {
        std::cerr << "Capture error: " << pcap_geterr(handle) << '\n';
        pcap_close(handle);
        return false;
    }

    pcap_close(handle);
    return true;
}