import React, { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import AvatarImage from "./AvatarImage";
import ProfileSwitcher from "./ProfileSwitcher";

export default function ProfileHeader({ children }: PropsWithChildren) {
  return (
    <View style={styles.headerContainer}>
      <View style={{ flexDirection: "row", gap: 7 }}>
        <AvatarImage
          source={require("../../../assets/images/girl.png")}
          size={75}
        />
        <ProfileSwitcher />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
