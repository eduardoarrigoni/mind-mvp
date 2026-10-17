import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { cores } from '../tema/tema';

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </>
  );
}
