#include <WiFi.h>
#include <PubSubClient.h>

// === CONFIGURATION ===
const char* ssid     = "Osadebamwen's Redmi Note 13";
const char* password = "khZTuvh8jzP55kHy1AUJ";

const char* mqtt_server   = "broker.emqx.io";
const int   mqtt_port     = 1883;
const char* mqtt_clientId = "esp32-auditorium-001";
const char* topic_status  = "campus/power/esp32-001/status";

const uint64_t sleepTime_us = 5 * 60 * 1000000ULL;  // Back to 5 minutes

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

  // WiFi connection with cleaner output and reasonable timeout
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {  // 12s max
    delay(500);
    Serial.print(".");
  }
  Serial.println();  // New line after dots

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected. IP: " + WiFi.localIP().toString());
    digitalWrite(2, LOW);  // Blue LED ON = WiFi good (temporary)
  } else {
    Serial.println("WiFi failed after timeout. Sleeping...");
    digitalWrite(2, HIGH);
    esp_deep_sleep_start();
  }

  // MQTT
  client.setServer(mqtt_server, mqtt_port);

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
    String msg = "online | boot:" + String(bootCount) + " | IP:" + WiFi.localIP().toString();
    bool pubSuccess = client.publish(topic_status, msg.c_str());
    Serial.println(pubSuccess ? "Published: " + msg : "Publish FAILED!");

    client.loop();
    delay(800);           // Critical delay for reliable transmission
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