#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage:
  ./capture_lab.sh <interface> <capture_id> <scenario_id> <duration_seconds>

Example:
  sudo ./capture_lab.sh eth0 benign_day1 benign_day1 300

The script writes:
  data/raw/<capture_id>.pcap
  data/manifests/<capture_id>.txt

Do not commit the generated data directory.
EOF
}

if [[ $# -ne 4 ]]; then
    usage
    exit 1
fi

INTERFACE="$1"
CAPTURE_ID="$2"
SCENARIO_ID="$3"
DURATION_SECONDS="$4"

if [[ ! "$CAPTURE_ID" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "Error: capture_id may contain only letters, numbers, _ and -." >&2
    exit 1
fi

if [[ ! "$SCENARIO_ID" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "Error: scenario_id may contain only letters, numbers, _ and -." >&2
    exit 1
fi

if ! [[ "$DURATION_SECONDS" =~ ^[0-9]+$ ]] || (( DURATION_SECONDS <= 0 )); then
    echo "Error: duration_seconds must be a positive integer." >&2
    exit 1
fi

if ! command -v tcpdump >/dev/null 2>&1; then
    echo "Error: tcpdump is not installed." >&2
    exit 1
fi

RAW_DIR="data/raw"
MANIFEST_DIR="data/manifests"
PCAP_PATH="${RAW_DIR}/${CAPTURE_ID}.pcap"
MANIFEST_PATH="${MANIFEST_DIR}/${CAPTURE_ID}.txt"

mkdir -p "$RAW_DIR" "$MANIFEST_DIR"

if [[ -e "$PCAP_PATH" ]]; then
    echo "Error: refusing to overwrite ${PCAP_PATH}" >&2
    exit 1
fi

START_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
START_EPOCH="$(date -u +%s)"

echo "Capturing passively on interface: ${INTERFACE}"
echo "Capture ID: ${CAPTURE_ID}"
echo "Scenario ID: ${SCENARIO_ID}"
echo "Duration: ${DURATION_SECONDS} seconds"
echo "Output: ${PCAP_PATH}"

# -n avoids DNS lookups by tcpdump.
# -s 0 captures full packets. Payload contents must not be used by the
# model for TLS/QUIC analysis; the intended features are metadata only.
sudo timeout --signal=INT "${DURATION_SECONDS}s" \
    tcpdump -i "$INTERFACE" -n -s 0 -w "$PCAP_PATH" || STATUS=$?

END_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
END_EPOCH="$(date -u +%s)"

cat > "$MANIFEST_PATH" <<EOF
capture_id=${CAPTURE_ID}
scenario_id=${SCENARIO_ID}
interface=${INTERFACE}
start_utc=${START_UTC}
start_epoch=${START_EPOCH}
end_utc=${END_UTC}
end_epoch=${END_EPOCH}
duration_seconds=${DURATION_SECONDS}
pcap_path=${PCAP_PATH}
EOF

echo
echo "Capture complete."
echo "PCAP: ${PCAP_PATH}"
echo "Manifest: ${MANIFEST_PATH}"
echo
echo "Next: label the relevant observation windows using your lab notes."
echo "Keep data/raw and data/manifests out of Git."