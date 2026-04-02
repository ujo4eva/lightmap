#include <WiFi.h>
#include <PubSubClient.h>

// === CONFIGURATION ===
const char* ssid     = "Osadebamwen's Redmi Note 13";
const char* password = "khZTuvh8jzP55kHy1AUJ";

const char* mqtt_server   = "broker.emqx.io";
const int   mqtt_port     = 1883;
const char* mqtt_clientId = "esp32-auditorium-001";
const char* topic_status  = "campus/power/esp32-001/status";
const char* topic_offline = "campus/power/esp32-001/offline";

const uint64_t sleepTime_us = 5 * 60 * 1000000ULL;  // 5 minutes

WiFiClient espClient;
PubSubClient client(espClient);

RTC_DATA_ATTR int bootCount = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n\n=== ESP32 Power Heartbeat Boot ===");
  Serial.printf("Boot count: %d\n", ++bootCount);

  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);  // LED OFF initially

  // WiFi connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected. IP: " + WiFi.localIP().toString());
    digitalWrite(2, LOW);  // Blue LED ON = WiFi good
  } else {
    Serial.println("WiFi failed after timeout. Sleeping...");
    digitalWrite(2, HIGH);
    esp_deep_sleep_start();
  }

  // MQTT with LWT (Last Will and Testament)
  client.setServer(mqtt_server, mqtt_port);
  
  // Configure LWT - broker will publish "offline" if client disconnects unexpectedly
  client.setWill(topic_offline, "offline", 1, true);  // retained=true so new subscribers get the last state

  int retries = 0;
  bool mqttConnected = false;
  while (!client.connected() && retries < 5) {
    Serial.print("MQTT connect attempt " + String(retries + 1));
    if (client.connect(mqtt_clientId)) {
      Serial.println(" → success!");
      mqttConnected = true;
    } else {
      Serial.print(" → failed, rc=");
      Serial.println(client.state());
      delay(1500);
      retries++;
    }
  }

  if (mqttConnected) {
    // First, clear any previous offline state by publishing online
    String onlineMsg = "online | boot:" + String(bootCount) + " | IP:" + WiFi.localIP().toString();
    client.publish(topic_status, onlineMsg.c_str(), true);  // retained=true
    Serial.println("Published: " + onlineMsg);
    
    client.loop();
    delay(800);
    digitalWrite(2, LOW); // Blue LED ON = full success
  } else {
    Serial.println("MQTT failed after retries.");
    digitalWrite(2, HIGH);
  }

  client.disconnect();
  delay(300);

  Serial.println("Going to deep sleep for 5 minutes...");
  Serial.flush();
  delay(100);

  esp_deep_sleep_start();
}

void loop() {}