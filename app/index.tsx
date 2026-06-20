import OnboardingScreen from "@/components/OnboardingScreen";
import {useAuthContext} from "@/lib/auth/auth-context";
import {storage} from "@/lib/storage";
import {useEffect, useState} from "react";
import {ActivityIndicator, View} from "react-native";

export default function Index() {
  const {isAuthenticated, isLoading} = useAuthContext();
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const comp = await storage.getOnboardingCompleted();
        setCompleted(comp);
      } catch {
        setCompleted(false);
      }
    })();
  }, []);

  // Show spinner while checking storage or if auth context is loading/restoring
  if (isLoading || completed === null) {
    return (
      <View style={{flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator color='#000000' size='large' />
      </View>
    );
  }

  // If the user is authenticated in context, show the spinner and let the layout redirect them to tabs.
  if (isAuthenticated) {
    return (
      <View style={{flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator color='#000000' size='large' />
      </View>
    );
  }

  // Show the spinner if onboarding is already completed (layout will redirect to /login)
  if (completed === true) {
    return (
      <View style={{flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator color='#000000' size='large' />
      </View>
    );
  }

  return <OnboardingScreen />;
}
