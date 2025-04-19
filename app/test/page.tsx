"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Clock, ArrowRight, CheckCircle } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Alert, AlertDescription } from "@/components/ui/alert"

type TestSection = "reading" | "listening" | "writing" | "speaking"

type TimerConfig = {
  reading: number
  listening: number
  writing: number
  speaking: number
}

// Store test results locally in browser for backup
const storeLocalResults = (results: any) => {
  try {
    const existingResults = JSON.parse(localStorage.getItem("testResults") || "[]")
    existingResults.push({
      timestamp: new Date().toISOString(),
      ...results,
    })
    localStorage.setItem("testResults", JSON.stringify(existingResults))
  } catch (e) {
    console.error("Error storing results locally:", e)
  }
}

export default function TestPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSection = (searchParams.get("section") as TestSection) || "reading"

  const [currentSection, setCurrentSection] = useState<TestSection>(initialSection)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isTestActive, setIsTestActive] = useState<boolean>(false)
  const [isTestComplete, setIsTestComplete] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>("")

  // Reading test answers
  const [readingAnswers, setReadingAnswers] = useState<string[]>(Array(5).fill(""))
  const correctReadingAnswers = ["temperature", "oxygen", "carbon", "water", "energy"]

  // Listening test answers
  const [listeningAnswers, setListeningAnswers] = useState<string[]>(Array(5).fill(""))
  const correctListeningAnswers = ["conference", "research", "university", "global", "presentation"]

  // Writing test answers
  const [writingAnswer, setWritingAnswer] = useState<string>("")

  // Speaking test answers
  const [speakingAnswer, setSpekingAnswer] = useState<string>("")

  // Timer configuration in seconds
  const timerConfig: TimerConfig = {
    reading: 60 * 60, // 60 minutes
    listening: 30 * 60, // 30 minutes
    writing: 60 * 60, // 60 minutes
    speaking: 15 * 60, // 15 minutes
  }

  // For development/testing, use shorter times
  const devTimerConfig: TimerConfig = {
    reading: 60, // 1 minute
    listening: 60, // 1 minute
    writing: 60, // 1 minute
    speaking: 60, // 1 minute
  }

  // Check if user is logged in
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn")
    if (!isLoggedIn) {
      router.push("/")
    }
  }, [router])

  // Initialize timer based on current section
  useEffect(() => {
    if (!isTestActive) {
      // Use development timer in preview mode
      const isDev = process.env.NODE_ENV === "development" || window.location.hostname === "localhost"
      setTimeRemaining(isDev ? devTimerConfig[currentSection] : timerConfig[currentSection])
    }
  }, [currentSection, isTestActive])

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isTestActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
    } else if (isTestActive && timeRemaining === 0) {
      // Move to next section when timer ends
      handleSectionComplete()
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isTestActive, timeRemaining])

  const startTest = () => {
    setIsTestActive(true)
  }

  const handleSectionComplete = () => {
    // Move to next section
    if (currentSection === "reading") {
      setCurrentSection("listening")
      setTimeRemaining(process.env.NODE_ENV === "development" ? devTimerConfig.listening : timerConfig.listening)
    } else if (currentSection === "listening") {
      setCurrentSection("writing")
      setTimeRemaining(process.env.NODE_ENV === "development" ? devTimerConfig.writing : timerConfig.writing)
    } else if (currentSection === "writing") {
      setCurrentSection("speaking")
      setTimeRemaining(process.env.NODE_ENV === "development" ? devTimerConfig.speaking : timerConfig.speaking)
    } else {
      // Test is complete - send results
      finishTest()
    }
  }

  const finishTest = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const readingScore = calculateReadingScore()
      const listeningScore = calculateListeningScore()

      const results = {
        student: "Abduraxmatov Abdulaziz",
        readingScore,
        readingPercentage: Math.round((readingScore / 5) * 100),
        listeningScore,
        listeningPercentage: Math.round((listeningScore / 5) * 100),
        writingAnswer: writingAnswer || "No response provided",
        speakingAnswer: speakingAnswer || "No response provided",
        completed: new Date().toLocaleString(),
      }

      // Store results locally in browser for backup
      storeLocalResults(results)

      const message = `
📊 *IELTS Test Results*

👤 *Student*: ${results.student}

📚 *Reading Score*: ${results.readingScore}/5 (${results.readingPercentage}%)
🎧 *Listening Score*: ${results.listeningScore}/5 (${results.listeningPercentage}%)

✍️ *Writing Response*:
${results.writingAnswer}

🗣️ *Speaking Notes*:
${results.speakingAnswer}

⏰ *Completed*: ${results.completed}
      `

      // Always log results to console as a reliable fallback
      console.log("========== TEST RESULTS ==========")
      console.log(message)
      console.log("==================================")

      try {
        // Send to API endpoint
        const response = await fetch("/api/send-telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to submit results")
        }
      } catch (apiError) {
        console.error("API route error:", apiError)
        // Continue with test completion even if API fails
      }

      // Show completion message
      setIsTestComplete(true)
      setIsTestActive(false)
    } catch (error) {
      console.error("Error submitting results:", error)
      setSubmitError(t("submit_error"))

      // Still complete the test even if there's an error
      setTimeout(() => {
        setIsTestComplete(true)
        setIsTestActive(false)
      }, 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours > 0 ? `${hours}:` : ""}${minutes < 10 && hours > 0 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const handleReadingAnswerChange = (index: number, value: string) => {
    const newAnswers = [...readingAnswers]
    newAnswers[index] = value
    setReadingAnswers(newAnswers)
  }

  const handleListeningAnswerChange = (index: number, value: string) => {
    const newAnswers = [...listeningAnswers]
    newAnswers[index] = value
    setListeningAnswers(newAnswers)
  }

  const calculateReadingScore = () => {
    return readingAnswers.filter((answer, index) => answer.toLowerCase().trim() === correctReadingAnswers[index]).length
  }

  const calculateListeningScore = () => {
    return listeningAnswers.filter((answer, index) => answer.toLowerCase().trim() === correctListeningAnswers[index])
      .length
  }

  const renderReadingSection = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-lg font-semibold">Reading Passage</h3>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md border h-[400px] overflow-y-auto">
            <h4 className="font-medium">Climate Change and Global Warming</h4>
            <p>
              Climate change refers to significant changes in global
              <strong> temperature</strong>, precipitation, wind patterns, and other measures of climate that occur over
              several decades or longer. Global warming refers to the long-term warming of the planet.
            </p>
            <p>
              The Earth's atmosphere contains various gases that act like a blanket, trapping the sun's heat and keeping
              the planet warm enough to sustain life. These gases, known as greenhouse gases, include carbon dioxide,
              methane, and nitrous oxide. Without these gases, the Earth would be too cold for humans to survive.
            </p>
            <p>
              However, human activities, particularly the burning of fossil fuels, have increased the concentration of
              greenhouse gases in the atmosphere. This enhanced greenhouse effect is trapping more heat and raising the
              Earth's average surface temperature.
            </p>
            <p>
              The burning of fossil fuels releases carbon dioxide and reduces the amount of
              <strong> oxygen</strong> in the atmosphere. Deforestation also contributes to climate change by reducing
              the number of trees that absorb
              <strong> carbon</strong> dioxide.
            </p>
            <p>
              Climate change has various effects on our planet. Rising temperatures cause glaciers and ice caps to melt,
              leading to rising sea levels. This can result in coastal flooding and erosion. Changes in precipitation
              patterns can lead to more frequent and severe droughts in some areas and increased rainfall and flooding
              in others.
            </p>
            <p>
              The availability of <strong>water</strong> resources is also affected by climate change. Changes in
              precipitation patterns and increased evaporation due to higher temperatures can lead to water scarcity in
              many regions.
            </p>
            <p>
              To mitigate climate change, we need to reduce greenhouse gas emissions. This can be achieved by
              transitioning to renewable <strong>energy</strong> sources, improving energy efficiency, and protecting
              and restoring forests.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Questions</h3>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md border h-[400px] overflow-y-auto">
            <p className="mb-4">{t("reading_instructions")}</p>

            <div className="space-y-4">
              <div>
                <p>1. Climate change involves significant changes in global ________.</p>
                <Input
                  value={readingAnswers[0]}
                  onChange={(e) => handleReadingAnswerChange(0, e.target.value)}
                  placeholder="Answer"
                  className="mt-1"
                />
              </div>

              <div>
                <p>2. Human activities reduce the amount of ________ in the atmosphere.</p>
                <Input
                  value={readingAnswers[1]}
                  onChange={(e) => handleReadingAnswerChange(1, e.target.value)}
                  placeholder="Answer"
                  className="mt-1"
                />
              </div>

              <div>
                <p>3. Trees play an important role by absorbing ________ dioxide.</p>
                <Input
                  value={readingAnswers[2]}
                  onChange={(e) => handleReadingAnswerChange(2, e.target.value)}
                  placeholder="Answer"
                  className="mt-1"
                />
              </div>

              <div>
                <p>4. Climate change affects the availability of ________ resources in many regions.</p>
                <Input
                  value={readingAnswers[3]}
                  onChange={(e) => handleReadingAnswerChange(3, e.target.value)}
                  placeholder="Answer"
                  className="mt-1"
                />
              </div>

              <div>
                <p>5. Transitioning to renewable ________ sources can help mitigate climate change.</p>
                <Input
                  value={readingAnswers[4]}
                  onChange={(e) => handleReadingAnswerChange(4, e.target.value)}
                  placeholder="Answer"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderListeningSection = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
        <h3 className="text-lg font-semibold mb-4">Listening Test</h3>
        <p className="mb-4">{t("listening_instructions")}</p>

        <div className="mb-6">
          <p className="italic text-gray-500 dark:text-gray-400 mb-2">
            Audio transcript (in a real test, you would listen to this):
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm">
            <p>
              Welcome to today's international climate change <strong>conference</strong>. We are gathered here to
              discuss the latest
              <strong> research</strong> on global warming and its effects. This event is hosted by Oxford
              <strong> University</strong> and brings together experts from around the world to address
              <strong> global</strong> environmental challenges. Each speaker will give a 20-minute
              <strong> presentation</strong> followed by a Q&A session.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p>1. The event is described as an international climate change ________.</p>
            <Input
              value={listeningAnswers[0]}
              onChange={(e) => handleListeningAnswerChange(0, e.target.value)}
              placeholder="Answer"
              className="mt-1"
            />
          </div>

          <div>
            <p>2. The participants will discuss the latest ________ on global warming.</p>
            <Input
              value={listeningAnswers[1]}
              onChange={(e) => handleListeningAnswerChange(1, e.target.value)}
              placeholder="Answer"
              className="mt-1"
            />
          </div>

          <div>
            <p>3. The event is hosted by Oxford ________.</p>
            <Input
              value={listeningAnswers[2]}
              onChange={(e) => handleListeningAnswerChange(2, e.target.value)}
              placeholder="Answer"
              className="mt-1"
            />
          </div>

          <div>
            <p>4. The experts will address ________ environmental challenges.</p>
            <Input
              value={listeningAnswers[3]}
              onChange={(e) => handleListeningAnswerChange(3, e.target.value)}
              placeholder="Answer"
              className="mt-1"
            />
          </div>

          <div>
            <p>5. Each speaker will give a 20-minute ________.</p>
            <Input
              value={listeningAnswers[4]}
              onChange={(e) => handleListeningAnswerChange(4, e.target.value)}
              placeholder="Answer"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderWritingSection = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
        <h3 className="text-lg font-semibold mb-4">Writing Task</h3>
        <p className="mb-4">{t("writing_instructions")}</p>

        <div className="mb-6">
          <p className="font-medium">Task:</p>
          <p className="mb-4">
            The chart below shows the percentage of households with access to the internet in four different countries
            between 2000 and 2020.
          </p>

          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
            <p className="text-center mb-2 font-medium">Internet Access by Household (%)</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Year</th>
                  <th className="p-2 text-right">Country A</th>
                  <th className="p-2 text-right">Country B</th>
                  <th className="p-2 text-right">Country C</th>
                  <th className="p-2 text-right">Country D</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">2000</td>
                  <td className="p-2 text-right">15%</td>
                  <td className="p-2 text-right">25%</td>
                  <td className="p-2 text-right">10%</td>
                  <td className="p-2 text-right">5%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">2005</td>
                  <td className="p-2 text-right">30%</td>
                  <td className="p-2 text-right">45%</td>
                  <td className="p-2 text-right">20%</td>
                  <td className="p-2 text-right">15%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">2010</td>
                  <td className="p-2 text-right">55%</td>
                  <td className="p-2 text-right">65%</td>
                  <td className="p-2 text-right">40%</td>
                  <td className="p-2 text-right">35%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">2015</td>
                  <td className="p-2 text-right">75%</td>
                  <td className="p-2 text-right">80%</td>
                  <td className="p-2 text-right">60%</td>
                  <td className="p-2 text-right">55%</td>
                </tr>
                <tr>
                  <td className="p-2">2020</td>
                  <td className="p-2 text-right">85%</td>
                  <td className="p-2 text-right">90%</td>
                  <td className="p-2 text-right">75%</td>
                  <td className="p-2 text-right">70%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-4">
            Summarize the information by selecting and reporting the main features, and make comparisons where relevant.
            Write at least 150 words.
          </p>

          <Textarea
            value={writingAnswer}
            onChange={(e) => setWritingAnswer(e.target.value)}
            placeholder="Write your answer here..."
            className="min-h-[200px]"
          />

          <div className="mt-2 text-sm text-gray-500 flex justify-between">
            <span>Word count: {writingAnswer.split(/\s+/).filter((word) => word.length > 0).length}</span>
            <span>Minimum: 150 words</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSpeakingSection = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
        <h3 className="text-lg font-semibold mb-4">Speaking Test</h3>
        <p className="mb-4">{t("speaking_instructions")}</p>

        <div className="mb-6">
          <p className="font-medium mb-2">Part 1: Introduction and Interview</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
            <p className="mb-2">The examiner will ask you some questions about yourself, such as:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>What is your name?</li>
              <li>Where are you from?</li>
              <li>Do you work or are you a student?</li>
              <li>What do you enjoy doing in your free time?</li>
              <li>Do you prefer to spend time indoors or outdoors? Why?</li>
            </ul>
          </div>

          <p className="font-medium mb-2">Part 2: Individual Long Turn</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
            <p className="mb-2">
              The examiner will give you a topic card and you will have 1 minute to prepare. Then you will speak for 1-2
              minutes on the topic.
            </p>
            <div className="border p-3 rounded-md bg-white dark:bg-gray-800">
              <p className="font-medium">Describe a place you have visited that you found interesting.</p>
              <p>You should say:</p>
              <ul className="list-disc pl-5">
                <li>where it is</li>
                <li>when you went there</li>
                <li>what you did there</li>
              </ul>
              <p>and explain why you found this place interesting.</p>
            </div>
          </div>

          <p className="font-medium mb-2">Part 3: Two-way Discussion</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
            <p className="mb-2">The examiner will ask you further questions related to the topic in Part 2:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>What types of places do people like to visit in your country?</li>
              <li>Do you think historic places are important to visit? Why?</li>
              <li>How has tourism changed in recent years?</li>
              <li>What can we learn from visiting different places?</li>
            </ul>
          </div>

          <p className="mb-4">
            In a real test, you would speak your answers. For this practice, you can write your responses to prepare.
          </p>

          <Textarea
            value={speakingAnswer}
            onChange={(e) => setSpekingAnswer(e.target.value)}
            placeholder="Write your practice responses here..."
            className="min-h-[200px]"
          />
        </div>
      </div>
    </div>
  )

  const renderTestComplete = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md border text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">{t("test_complete")}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t("test_complete_hidden_message")}</p>

        <div className="mt-8">
          <Button onClick={() => (window.location.href = "/")}>{t("return_home")}</Button>
        </div>
      </div>
    </div>
  )

  const renderCurrentSection = () => {
    if (isTestComplete) {
      return renderTestComplete()
    }

    switch (currentSection) {
      case "reading":
        return renderReadingSection()
      case "listening":
        return renderListeningSection()
      case "writing":
        return renderWritingSection()
      case "speaking":
        return renderSpeakingSection()
      default:
        return renderReadingSection()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isTestComplete ? t("test_complete") : `${t(currentSection)} ${t("test")}`}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {isTestComplete ? t("test_complete_description") : t(`${currentSection}_description`)}
            </p>
          </div>

          {!isTestComplete && (
            <div className="flex items-center gap-4">
              {!isTestActive ? (
                <Button onClick={startTest}>{t("start_test")}</Button>
              ) : (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-md">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">{formatTime(timeRemaining)}</span>
                </div>
              )}

              {isTestActive && (
                <Button onClick={handleSectionComplete} disabled={isSubmitting}>
                  {currentSection === "speaking" ? t("finish_test") : t("next_section")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {!isTestActive && !isTestComplete ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("test_instructions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t(`${currentSection}_instructions`)}</p>
              <div className="mt-4 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                <Clock className="h-5 w-5 text-gray-500" />
                <span>
                  {t("time_allowed")}:{" "}
                  {formatTime(
                    process.env.NODE_ENV === "development"
                      ? devTimerConfig[currentSection]
                      : timerConfig[currentSection],
                  )}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={startTest}>{t("start_test")}</Button>
            </CardFooter>
          </Card>
        ) : (
          renderCurrentSection()
        )}
      </div>
    </div>
  )
}
