import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours24 = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";

  const formattedTime = `${hours24
    .toString()
    .padStart(2, "0")}:${minutes}:${seconds} ${period}`;

  return (
    <View>
      <Text>{formattedTime}</Text>
    </View>
  );
}
