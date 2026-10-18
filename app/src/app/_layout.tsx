import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessaoProvider } from '../sessao/SessaoContext';
import { cores } from '../tema/tema';

export default function Layout() {
  return (
    <SessaoProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </SessaoProvider>
  );
}
