import AppText from "@/src/components/AppText";
import Screen from "@/src/components/layout/Screen";
import Section from "@/src/components/layout/Section";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import React from "react";

export default function Stock() {
  return (
    <SwipeableTabScreen activeRoute="/(tabs)/stock">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section>
          <AppText>Stock</AppText>
        </Section>
      </Screen>
    </SwipeableTabScreen>
  );
}
