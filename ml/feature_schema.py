"""
Feature contract for the NetraVerse models.

The service and training pipeline must produce these same numeric features.
Unavailable protocol metadata must be represented with its `*_available`
feature set to 0, rather than guessed or filled with a misleading value.

These names are a starting contract. Validate that your C++ feature
extractor computes each one exactly as documented before using a model
for live detections.
"""

THREAT_FEATURES = {
    "ddos": [
        "packets_per_second",
        "bytes_per_second",
        "tcp_syn_ratio",
        "udp_packet_ratio",
        "unique_sources_per_destination",
        "source_ip_entropy",
        "destination_packet_rate",
        "destination_byte_rate",
        "observation_window_seconds",
    ],

    "c2_beaconing": [
        "flow_duration_seconds",
        "connection_count",
        "mean_interarrival_seconds",
        "interarrival_std_seconds",
        "interarrival_cv",
        "periodicity_score",
        "repeated_destination_count",
        "mean_packet_size",
        "packet_size_std",
        "observation_window_seconds",
    ],

    "dns_tunneling_dga": [
        "dns_query_length",
        "dns_label_count",
        "dns_digit_ratio",
        "dns_vowel_ratio",
        "dns_character_entropy",
        "dns_bigram_entropy",
        "dns_query_rate",
        "dns_unusual_record_type_ratio",
        "dns_metadata_available",
    ],

    "encrypted_malware": [
        "tls_metadata_available",
        "tls_version_code",
        "tls_cipher_count",
        "tls_extension_count",
        "tls_handshake_packet_count",
        "quic_metadata_available",
        "mean_packet_size",
        "packet_size_std",
        "mean_interarrival_seconds",
        "interarrival_cv",
    ],

    "reconnaissance": [
        "syn_packets_per_second",
        "unique_destination_ports",
        "unique_destination_hosts",
        "connection_attempt_count",
        "failed_connection_ratio",
        "destination_port_entropy",
        "observation_window_seconds",
    ],

    "data_exfiltration": [
        "outbound_bytes",
        "inbound_bytes",
        "outbound_inbound_byte_ratio",
        "outbound_bytes_per_second",
        "flow_duration_seconds",
        "destination_baseline_deviation",
        "observation_window_seconds",
    ],
}

# One row is one labelled observation window or flow-window produced by
# your feature extractor. These columns identify and label the row; do not
# pass them into model inference.
METADATA_COLUMNS = [
    "capture_id",
    "scenario_id",
    "window_start_epoch",
    "flow_id",
]

LABEL_COLUMNS = {
    "ddos": "label_ddos",
    "c2_beaconing": "label_c2_beaconing",
    "dns_tunneling_dga": "label_dns_tunneling_dga",
    "encrypted_malware": "label_encrypted_malware",
    "reconnaissance": "label_reconnaissance",
    "data_exfiltration": "label_data_exfiltration",
}

THREAT_CLASS_NAMES = {
    "ddos": "VOLUMETRIC_PROTOCOL_DDOS",
    "c2_beaconing": "BOTNET_C2_BEACONING",
    "dns_tunneling_dga": "DGA_DNS_TUNNELLING",
    "encrypted_malware": "ENCRYPTED_SESSION_MALWARE_INDICATOR",
    "reconnaissance": "RECONNAISSANCE_PORT_SCAN",
    "data_exfiltration": "DATA_EXFILTRATION",
}

def validate_feature_csv_columns(columns):
    """
    Raise a readable error if an extracted feature CSV is missing
    required metadata, feature, or label columns.
    """
    column_set = set(columns)

    required = set(METADATA_COLUMNS)
    required.update(LABEL_COLUMNS.values())

    for features in THREAT_FEATURES.values():
        required.update(features)

    missing = sorted(required - column_set)
    if missing:
        raise ValueError(
            "Feature CSV is missing required columns:\n  "
            + "\n  ".join(missing)
        )