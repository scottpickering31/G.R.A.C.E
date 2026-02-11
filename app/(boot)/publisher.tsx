import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, View } from "react-native";

export default function Publisher() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(boot)/splash");
    }, 1000);

    return () => clearTimeout(t);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
      }}
    >
      <Image
        source={require("../../assets/images/publisher.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );
}
