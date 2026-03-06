import { usePrimaryPatient } from "@/src/api/medications/hooks";
import { useAuthStore } from "@/src/state/auth.store";
import React from "react";
import {
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import AvatarImage from "./AvatarImage";
import ProfileSwitcher from "./ProfileSwitcher";

export type ProfileHeaderProps = {
  style?: ViewStyle;
  children?: React.ReactNode;
  avatarSource?: ImageSourcePropType | null;
};

function getInitials(name?: string | null) {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "P";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileHeader({
  style,
  children,
  avatarSource = null,
}: ProfileHeaderProps) {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryPatient } = usePrimaryPatient(userId);
  const patientName = primaryPatient?.display_name ?? "Patient";
  const patientInitials = getInitials(patientName);

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
              source={avatarSource}
              initials={patientInitials}
              size={75}
            />
          </View>
        </Pressable>
        <ProfileSwitcher
          patientName={patientName}
          dob={primaryPatient?.dob ?? null}
        />
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
