import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import type { TextStyle } from "react-native";
import AppText from "../AppText";

type Props = {
  children: string;
  style?: TextStyle;
  colors: readonly [string, string, ...string[]];
};

export function GradientText({ children, style, colors }: Props) {
  return (
    <MaskedView
      maskElement={
        <AppText style={[style, { backgroundColor: "transparent" }]}>
          {children}
        </AppText>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <AppText style={[style, { opacity: 0 }]}>{children}</AppText>
      </LinearGradient>
    </MaskedView>
  );
}
