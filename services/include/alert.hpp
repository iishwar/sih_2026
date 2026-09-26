#pragma once

#include <string>

struct Alert {
    std::string timestamp;
    std::string flow_id;
    std::string threat_class;

    double confidence = 0.0;
    std::string severity;
    std::string evidence_json;
};

std::string current_utc_timestamp();
std::string alert_to_json(const Alert& alert);
std::string json_escape(const std::string& value);