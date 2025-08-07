import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Pill, Calendar, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-app-light-bronze via-white to-app-light-bronze">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <Heart className="w-16 h-16 text-app-blue mr-4" />
            <h1 className="text-5xl font-bold text-app-blue">FemCare</h1>
          </div>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your comprehensive women's health companion for medication tracking, 
            cycle management, and daily wellness journaling.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-app-blue hover:bg-app-blue/90 text-white px-12 py-4 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-medium"
          >
            Sign In to Continue
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 notepad-shadow">
            <CardHeader className="text-center pb-4">
              <Pill className="w-16 h-16 text-app-blue mx-auto mb-4" />
              <CardTitle className="text-app-blue text-xl font-semibold">Medication Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-700 leading-relaxed">
                Track medications and vitamins with cycle-based scheduling, supply monitoring, and daily checklists.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 notepad-shadow">
            <CardHeader className="text-center pb-4">
              <Calendar className="w-16 h-16 text-app-bronze mx-auto mb-4" />
              <CardTitle className="text-app-bronze text-xl font-semibold">Cycle Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-700 leading-relaxed">
                Monitor your menstrual cycle with smart predictions and medication scheduling tied to cycle phases.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 notepad-shadow md:col-span-2 lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <BookOpen className="w-16 h-16 text-app-blue mx-auto mb-4" />
              <CardTitle className="text-app-blue text-xl font-semibold">Health Journal</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-700 leading-relaxed">
                Daily mood and symptom tracking with insights to understand your health patterns.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-semibold text-app-blue mb-6">
            Designed for Women's Health
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            FemCare combines medication management with menstrual cycle awareness, 
            providing a holistic approach to women's health tracking with beautiful, 
            intuitive design and powerful features.
          </p>
        </div>
      </div>
    </div>
  );
}