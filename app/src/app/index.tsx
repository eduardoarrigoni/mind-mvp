import { Redirect } from 'expo-router';

/** Ponto de entrada: sem sessão ainda (PB08), o fluxo começa pelo login. */
export default function Inicio() {
  return <Redirect href="/login" />;
}
