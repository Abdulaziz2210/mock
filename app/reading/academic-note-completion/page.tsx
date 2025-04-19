"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

type Answer = {
  id: number
  userAnswer: string
  correctAnswer: string
}

export default function AcademicNoteCompletion() {
  const { t } = useLanguage()
  const [answers, setAnswers] = useState<Answer[]>([
    { id: 1, userAnswer: "", correctAnswer: "temperature" },
    { id: 2, userAnswer: "", correctAnswer: "oxygen" },
    { id: 3, userAnswer: "", correctAnswer: "carbon" },
    { id: 4, userAnswer: "", correctAnswer: "water" },
    { id: 5, userAnswer: "", correctAnswer: "energy" },
  ])
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(20 * 60) // 20 minutes in seconds
  const [activeTab, setActiveTab] = useState("passage")

  useEffect(() => {
    if (!submitted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && !submitted) {
      handleSubmit()
    }
  }, [timeRemaining, submitted])

  const handleAnswerChange = (id: number, value: string) => {
    setAnswers(answers.map((answer) => (answer.id === id ? { ...answer, userAnswer: value } : answer)))
  }

  const handleSubmit = () => {
    const newScore = answers.filter((answer) => answer.userAnswer.toLowerCase() === answer.correctAnswer).length
    setScore(newScore)
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers(answers.map((answer) => ({ ...answer, userAnswer: "" })))
    setSubmitted(false)
    setScore(0)
    setTimeRemaining(20 * 60)
    setActiveTab("passage")
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{t("reading_test_title")}</h1>
              <p className="text-gray-500 dark:text-gray-400">{t("reading_instructions")}</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-md">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="font-medium">
                {t("time_remaining")}: {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <Tabs defaultValue="passage" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="passage">Passage</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>
            <TabsContent value="passage" className="p-4 border rounded-md mt-2">
              <div className="prose dark:prose-invert max-w-none">
                <h2>Climate Change and Global Warming</h2>
                <p>
                  Climate change refers to significant changes in global
                  <strong> temperature</strong>, precipitation, wind patterns, and other measures of climate that occur
                  over several decades or longer. Global warming refers to the long-term warming of the planet.
                </p>
                <p>
                  The Earth's atmosphere contains various gases that act like a blanket, trapping the sun's heat and
                  keeping the planet warm enough to sustain life. These gases, known as greenhouse gases, include carbon
                  dioxide, methane, and nitrous oxide. Without these gases, the Earth would be too cold for humans to
                  survive.
                </p>
                <p>
                  However, human activities, particularly the burning of fossil fuels, have increased the concentration
                  of greenhouse gases in the atmosphere. This enhanced greenhouse effect is trapping more heat and
                  raising the Earth's average surface temperature.
                </p>
                <p>
                  The burning of fossil fuels releases carbon dioxide and reduces the amount of
                  <strong> oxygen</strong> in the atmosphere. Deforestation also contributes to climate change by
                  reducing the number of trees that absorb
                  <strong> carbon</strong> dioxide.
                </p>
                <p>
                  Climate change has various effects on our planet. Rising temperatures cause glaciers and ice caps to
                  melt, leading to rising sea levels. This can result in coastal flooding and erosion. Changes in
                  precipitation patterns can lead to more frequent and severe droughts in some areas and increased
                  rainfall and flooding in others.
                </p>
                <p>
                  Climate change also affects ecosystems and biodiversity. Many species may not be able to adapt to
                  rapid changes in their environment. Rising temperatures and changes in precipitation can alter
                  habitats, forcing species to migrate or face extinction.
                </p>
                <p>
                  The availability of <strong>water</strong> resources is also affected by climate change. Changes in
                  precipitation patterns and increased evaporation due to higher temperatures can lead to water scarcity
                  in many regions.
                </p>
                <p>
                  Climate change can also impact human health. Heat waves can cause heat-related illnesses and deaths.
                  Changes in temperature and precipitation can alter the geographic range of disease-carrying insects,
                  potentially exposing more people to diseases like malaria and dengue fever.
                </p>
                <p>
                  To mitigate climate change, we need to reduce greenhouse gas emissions. This can be achieved by
                  transitioning to renewable <strong>energy</strong> sources, improving energy efficiency, and
                  protecting and restoring forests.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="questions" className="space-y-6 p-4 border rounded-md mt-2">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Complete the notes below:</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p>
                    Climate change involves significant changes in global
                    <Input
                      className="w-32 mx-2 inline-block"
                      placeholder="1"
                      value={answers[0].userAnswer}
                      onChange={(e) => handleAnswerChange(1, e.target.value)}
                      disabled={submitted}
                    />
                    and other climate measures over long periods.
                  </p>
                  <p>
                    Human activities reduce the amount of
                    <Input
                      className="w-32 mx-2 inline-block"
                      placeholder="2"
                      value={answers[1].userAnswer}
                      onChange={(e) => handleAnswerChange(2, e.target.value)}
                      disabled={submitted}
                    />
                    in the atmosphere.
                  </p>
                  <p>
                    Trees play an important role by absorbing
                    <Input
                      className="w-32 mx-2 inline-block"
                      placeholder="3"
                      value={answers[2].userAnswer}
                      onChange={(e) => handleAnswerChange(3, e.target.value)}
                      disabled={submitted}
                    />
                    dioxide.
                  </p>
                  <p>
                    Climate change affects the availability of
                    <Input
                      className="w-32 mx-2 inline-block"
                      placeholder="4"
                      value={answers[3].userAnswer}
                      onChange={(e) => handleAnswerChange(4, e.target.value)}
                      disabled={submitted}
                    />
                    resources in many regions.
                  </p>
                  <p>
                    Transitioning to renewable
                    <Input
                      className="w-32 mx-2 inline-block"
                      placeholder="5"
                      value={answers[4].userAnswer}
                      onChange={(e) => handleAnswerChange(5, e.target.value)}
                      disabled={submitted}
                    />
                    sources can help mitigate climate change.
                  </p>
                </div>
              </div>

              {submitted ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      {t("test_complete")}
                    </CardTitle>
                    <CardDescription>
                      {t("your_score")}: {score}/{answers.length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(score / answers.length) * 100} className="h-2" />
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium">{t("correct_answers")}:</h4>
                      <ul className="space-y-2">
                        {answers.map((answer) => (
                          <li key={answer.id} className="flex items-start gap-2">
                            {answer.userAnswer.toLowerCase() === answer.correctAnswer ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            )}
                            <div>
                              <span className="font-medium">Question {answer.id}: </span>
                              {answer.userAnswer.toLowerCase() === answer.correctAnswer ? (
                                <span className="text-green-600 dark:text-green-400">
                                  {answer.userAnswer || "(empty)"} ✓
                                </span>
                              ) : (
                                <>
                                  <span className="text-red-600 dark:text-red-400">
                                    {answer.userAnswer || "(empty)"} ✗
                                  </span>
                                  <span className="ml-2 text-gray-500">Correct: {answer.correctAnswer}</span>
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleReset} className="w-full">
                      {t("try_again")}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex justify-end">
                  <Button onClick={handleSubmit}>{t("submit")}</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Dream Zone. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
