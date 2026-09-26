#include "alert.hpp"

#include <ctime>
#include <iomanip>
#include <sstream>

std::string current_utc_timestamp() {
    const std::time_t now = std::time(nullptr);

    std::tm utc_time {};
#if defined(_WIN32)
    gmtime_s(&utc_time, &now);
#else
    gmtime_r(&now, &utc_time);
#endif

    std::ostringstream output;
    output << std::put_time(&utc_time, "%Y-%m-%dT%H:%M:%SZ");
    return output.str();
}

std::string json_escape(const std::string& value) {
    std::ostringstream output;

    for (const char character : value) {
        switch (character) {
            case '"':
                output << "\\\"";
                break;
            case '\\':
                output << "\\\\";
                break;
            case '\b':
                output << "\\b";
                break;
            case '\f':
                output << "\\f";
                break;
            case '\n':
                output << "\\n";
                break;
            case '\r':
                output << "\\r";
                break;
            case '\t':
                output << "\\t";
                break;
            default:
                if (static_cast<unsigned char>(character) < 0x20) {
                    output << ' ';
                } else {
                    output << character;
                }
        }
    }

    return output.str();
}

std::string alert_to_json(const Alert& alert) {
    std::ostringstream output;
    output << std::fixed << std::setprecision(3);

    output << "{"
           << "\"timestamp\":\"" << json_escape(alert.timestamp) << "\","
           << "\"flow_id\":\"" << json_escape(alert.flow_id) << "\","
           << "\"threat_class\":\"" << json_escape(alert.threat_class) << "\","
           << "\"confidence\":" << alert.confidence << ","
           << "\"severity\":\"" << json_escape(alert.severity) << "\","
           << "\"evidence\":" << alert.evidence_json
           << "}";

    return output.str();
}