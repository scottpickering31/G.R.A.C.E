import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import AvatarImage from "./AvatarImage";
import ProfileSwitcher from "./ProfileSwitcher";

export type ProfileHeaderProps = {
  style?: ViewStyle;
  children?: React.ReactNode;
};

export default function ProfileHeader({ style, children }: ProfileHeaderProps) {
  return (
    <View style={[styles.headerContainer, style]}>
      <View style={{ flexDirection: "row", gap: 7 }}>
        <Pressable
          onPress={() => {
            console.log(
              "This will open Avatar Image, change avatar, access camera etc?",
            );
          }}
        >
          <View>
            <AvatarImage
              source={require("../../../assets/images/girl.png")}
              size={85}
            />
          </View>
        </Pressable>
        <ProfileSwitcher />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "60%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
