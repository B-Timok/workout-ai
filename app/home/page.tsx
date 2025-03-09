import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Dumbbell, Zap, Brain, Calendar, BarChart3, Trophy, Star } from "lucide-react"
import HomeHeader from "@/components/home-header"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background z-0"></div>
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Your Personal AI Workout Assistant</h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create personalized workout routines, track your progress, and achieve your fitness goals with the help
                of AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Brain className="h-8 w-8 text-primary" />}
                title="AI-Powered Workouts"
                description="Get personalized workout routines created by AI based on your goals, fitness level, and preferences."
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-primary" />}
                title="Progress Tracking"
                description="Track your workouts, monitor your progress, and visualize your improvements over time."
              />
              <FeatureCard
                icon={<Calendar className="h-8 w-8 text-primary" />}
                title="Workout Scheduling"
                description="Plan your workout schedule and receive reminders to stay consistent with your fitness routine."
              />
              <FeatureCard
                icon={<Dumbbell className="h-8 w-8 text-primary" />}
                title="Exercise Library"
                description="Access a comprehensive library of exercises with proper form instructions and video demonstrations."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-primary" />}
                title="Adaptive Workouts"
                description="Workouts that adapt to your progress, ensuring you're always challenged but not overwhelmed."
              />
              <FeatureCard
                icon={<Trophy className="h-8 w-8 text-primary" />}
                title="Goal Setting"
                description="Set fitness goals and track your progress towards achieving them with milestone celebrations."
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">What Our Users Say</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of users who have transformed their fitness journey with our AI workout assistant.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="This app has completely transformed my workout routine. The AI suggestions are spot-on and I've seen real progress in just a few weeks."
                author="Alex K."
                rating={5}
              />
              <TestimonialCard
                quote="As someone who was intimidated by the gym, this app gave me the confidence to start working out. The personalized plans make all the difference."
                author="Jamie T."
                rating={5}
              />
              <TestimonialCard
                quote="I love how the app adapts to my progress. When I'm consistent, it challenges me more, and when I need to ease back, it adjusts accordingly."
                author="Sam R."
                rating={4}
              />
            </div>
          </div>
        </section>

        {/* Workout Categories */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Workout Categories</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <CategoryCard
                title="Strength Training"
                description="Build muscle and increase strength with targeted resistance workouts."
                image="/placeholder.svg?height=200&width=300"
              />
              <CategoryCard
                title="Cardio"
                description="Improve heart health and burn calories with effective cardio routines."
                image="/placeholder.svg?height=200&width=300"
              />
              <CategoryCard
                title="Flexibility"
                description="Enhance your range of motion and prevent injuries with stretching exercises."
                image="/placeholder.svg?height=200&width=300"
              />
              <CategoryCard
                title="HIIT"
                description="Maximize calorie burn and efficiency with high-intensity interval training."
                image="/placeholder.svg?height=200&width=300"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/10">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness Journey?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join now and get personalized workout plans tailored to your goals and fitness level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/signup">
                  Sign Up Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Already have an account?</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Dumbbell className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold">Athlos</span>
            </div>
            <div className="flex gap-8 mb-4 md:mb-0">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contact Us
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Athlos. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper Components
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({
  quote,
  author,
  rating,
}: {
  quote: string
  author: string
  rating: number
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rating ? "text-primary fill-primary" : "text-muted"}`} />
          ))}
        </div>
        <p className="mb-4 italic">"{quote}"</p>
        <p className="font-medium">— {author}</p>
      </CardContent>
    </Card>
  )
}

function CategoryCard({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg">
      <img
        src={image || "/placeholder.svg"}
        alt={title}
        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{description}</p>
      </div>
    </div>
  )
}

