import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../store';
import { useReducedMotion } from '../ui';
import { PhonePreview } from '../phone-preview';
export default function Layout() { const reduced = useReducedMotion(); const [loaded,error] = useFonts({DM_Regular:require('../../assets/fonts/DMSans_400Regular.ttf'),DM_Medium:require('../../assets/fonts/DMSans_500Medium.ttf'),DM_Semibold:require('../../assets/fonts/DMSans_600SemiBold.ttf')}); if(!loaded && !error) return <View style={{flex:1,backgroundColor:'#FAF9F6'}}/>; return <StoreProvider><PhonePreview><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: reduced !== false ? 'none' : 'slide_from_right' }}><Stack.Screen name="index" options={{ animation: reduced !== false ? 'none' : 'fade' }} /><Stack.Screen name="welcome" options={{ animation: reduced !== false ? 'none' : 'fade' }} /></Stack></PhonePreview></StoreProvider>; }
