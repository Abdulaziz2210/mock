"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Maximize, Minimize } from "lucide-react"

type TestSection = "reading" | "listening" | "writing"
type ReadingPassage = 1 | 2 | 3

type TimerConfig = {
  reading: number
  listening: number
  writing: number
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

// Convert raw score to IELTS band score
const calculateBandScore = (rawScore: number, totalQuestions: number): number => {
  // Return 0 if the raw score is 0
  if (rawScore === 0) return 0

  // IELTS approximate band score conversion
  const percentage = (rawScore / totalQuestions) * 100

  if (percentage >= 90) return 9.0
  if (percentage >= 85) return 8.5
  if (percentage >= 80) return 8.0
  if (percentage >= 75) return 7.5
  if (percentage >= 70) return 7.0
  if (percentage >= 65) return 6.5
  if (percentage >= 60) return 6.0
  if (percentage >= 55) return 5.5
  if (percentage >= 50) return 5.0
  if (percentage >= 45) return 4.5
  if (percentage >= 40) return 4.0
  if (percentage >= 35) return 3.5
  if (percentage >= 30) return 3.0
  if (percentage >= 25) return 2.5

  return 2.0 // Minimum band score (unless score is 0)
}

export default function TestPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSection = (searchParams.get("section") as TestSection) || "reading"

  const [currentSection, setCurrentSection] = useState<TestSection>(initialSection)
  const [currentPassage, setCurrentPassage] = useState<ReadingPassage>(1)
  const [currentListeningSection, setCurrentListeningSection] = useState<number>(1)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isTestActive, setIsTestActive] = useState<boolean>(false)
  const [isTestComplete, setIsTestComplete] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false)

  // Reading test answers - 40 questions
  const [readingAnswers, setReadingAnswers] = useState<string[]>(Array(40).fill(""))

  // Correct answers for reading
  const correctReadingAnswers = [
    // Passage 1 (13 questions)
    "TRUE", // 1
    "FALSE", // 2
    "FALSE", // 3
    "TRUE", // 4
    "FALSE", // 5
    "TRUE", // 6
    "NOT GIVEN", // 7
    "46", // 8
    "the human eye", // 9
    "Indo-European", // 10
    "Richard Brocklesby", // 11
    "Royal Institution", // 12
    "gas lighting", // 13

    // Passage 2 (13 questions)
    "v", // 14
    "ii", // 15
    "iv", // 16
    "viii", // 17
    "i", // 18
    "iii", // 19
    "vi", // 20
    "sewing machine", // 21
    "department stores", // 22
    "prices", // 23
    "Europe", // 24
    "C", // 25
    "D", // 26

    // Passage 3 (14 questions)
    "D", // 27
    "L", // 28
    "F", // 29
    "J", // 30
    "I", // 31
    "B", // 32
    "YES", // 33
    "NOT GIVEN", // 34
    "YES", // 35
    "NOT GIVEN", // 36
    "D", // 37
    "A", // 38
    "B", // 39
    "C", // 40
  ]

  // Listening test answers - 40 questions
  const [listeningAnswers, setListeningAnswers] = useState<string[]>(Array(40).fill(""))

  // Correct answers for listening
  const correctListeningAnswers = [
    // Section 1 (10 questions)
    "database", // 1
    "rock", // 2
    "month", // 3
    "25", // 4
    "500", // 5
    "studio", // 6
    "legal", // 7
    "photograph", // 8
    "King", // 9
    "alive", // 10

    // Section 2 (10 questions)
    "A", // 11
    "B", // 12
    "C", // 13
    "C", // 14
    "F", // 15
    "A", // 16
    "D", // 17
    "H", // 18
    "B", // 19
    "G", // 20

    // Section 3 (10 questions)
    "A", // 21
    "C", // 22
    "C", // 23
    "A", // 24
    "C", // 25
    "C", // 26
    "B", // 27
    "C", // 28
    "F", // 29
    "D", // 30

    // Section 4 (10 questions)
    "erosion", // 31
    "fuel", // 32
    "pesticides", // 33
    "rubbish", // 34
    "bamboo", // 35
    "red", // 36
    "nursery", // 37
    "fresh", // 38
    "crab", // 39
    "storm", // 40
  ]

  // Writing test answers
  const [writingAnswer1, setWritingAnswer1] = useState<string>("")
  const [writingAnswer2, setWritingAnswer2] = useState<string>("")

  // Band scores
  const [readingBand, setReadingBand] = useState<number>(0)
  const [listeningBand, setListeningBand] = useState<number>(0)
  const [writingBand, setWritingBand] = useState<number>(0)
  const [overallBand, setOverallBand] = useState<number>(0)

  // Timer configuration in seconds
  const timerConfig: TimerConfig = {
    reading: 60 * 60, // 60 minutes
    listening: 30 * 60, // 30 minutes
    writing: 60 * 60, // 60 minutes
  }

  // For development/testing, use shorter times
  const devTimerConfig: TimerConfig = {
    reading: 3 * 60, // 3 minutes
    listening: 3 * 60, // 3 minutes
    writing: 3 * 60, // 3 minutes
  }

  // Check if user is logged in
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn")
    const user = sessionStorage.getItem("currentUser") || ""

    if (!isLoggedIn) {
      router.push("/")
    } else {
      setCurrentUser(user)
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
      if (currentSection === "reading" && currentPassage < 3) {
        handleNextPassage()
      } else {
        handleSectionComplete()
      }
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isTestActive, timeRemaining, currentSection, currentPassage])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const startTest = () => {
    setIsTestActive(true)
  }

  const handleNextPassage = () => {
    if (currentPassage < 3) {
      setCurrentPassage((prev) => (prev + 1) as ReadingPassage)
    }
  }

  const handleNextListeningSection = () => {
    if (currentListeningSection < 4) {
      setCurrentListeningSection(currentListeningSection + 1)
    }
  }

  const handleSectionComplete = () => {
    // Move to next section
    if (currentSection === "reading") {
      // Calculate reading band score before moving to next section
      const readingScore = calculateReadingScore()
      const band = calculateBandScore(readingScore, correctReadingAnswers.length)
      setReadingBand(band)

      setCurrentSection("listening")
      setCurrentListeningSection(1)
      setTimeRemaining(process.env.NODE_ENV === "development" ? devTimerConfig.listening : timerConfig.listening)
    } else if (currentSection === "listening") {
      // Calculate listening band score
      const listeningScore = calculateListeningScore()
      const band = calculateBandScore(listeningScore, correctListeningAnswers.length)
      setListeningBand(band)

      setCurrentSection("writing")
      setTimeRemaining(process.env.NODE_ENV === "development" ? devTimerConfig.writing : timerConfig.writing)
    } else if (currentSection === "writing") {
      // Estimate writing band score (in a real test this would be assessed by an examiner)
      // Here we're using word count as a simple proxy
      const task1Words = writingAnswer1.split(/\s+/).filter((word) => word.length > 0).length
      const task2Words = writingAnswer2.split(/\s+/).filter((word) => word.length > 0).length

      let estimatedBand = 0
      if (task1Words >= 150 && task2Words >= 250) {
        estimatedBand = 6.0 // Base score for meeting minimum word count
        if (task1Words >= 170 && task2Words >= 280) estimatedBand = 6.5
        if (task1Words >= 180 && task2Words >= 300) estimatedBand = 7.0
      } else {
        estimatedBand = 5.0 // Below minimum word count
      }

      setWritingBand(estimatedBand)

      // Calculate overall band score (average of all sections)
      const overall = (readingBand + listeningBand + estimatedBand) / 3
      setOverallBand(Math.round(overall * 10) / 10) // Round to nearest 0.1

      // Test is complete - send results
      finishTest()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (fullscreenContainerRef.current?.requestFullscreen) {
        fullscreenContainerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause()
        setIsAudioPlaying(false)
      } else {
        // First, check if the audio is actually loaded
        if (audioRef.current.readyState === 0) {
          // Audio not loaded yet, try to load it first
          audioRef.current.load()

          // Show a message to the user
          alert(
            "Audio is loading. Please try again in a moment. If the issue persists, ensure the audio file exists in the public/audio directory.",
          )
          return
        }

        // Try to play the audio
        try {
          const playPromise = audioRef.current.play()

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsAudioPlaying(true)
                console.log("Audio playback started successfully")
              })
              .catch((error) => {
                console.error("Audio playback failed:", error)
                setIsAudioPlaying(false)

                // Provide a more helpful message
                if (error.name === "NotAllowedError") {
                  alert("Browser blocked autoplay. Please interact with the page first and try again.")
                } else if (error.name === "NotSupportedError") {
                  alert("Audio format not supported by your browser.")
                } else {
                  alert(
                    `Audio playback failed: ${error.message || "Unknown error"}. Please ensure the audio file exists in the public/audio directory.`,
                  )
                }
              })
          }
        } catch (error) {
          console.error("Error playing audio:", error)
          setIsAudioPlaying(false)
          alert(`Error playing audio: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    } else {
      alert("Audio player not initialized. Please refresh the page and try again.")
    }
  }

  // Add this effect to auto-play audio when listening section starts
  useEffect(() => {
    // Auto-play audio when listening section starts
    if (currentSection === "listening" && isTestActive && audioRef.current && !isAudioPlaying) {
      // First check if the audio is loaded
      if (audioRef.current.readyState === 0) {
        console.log("Audio not loaded yet, attempting to load...")
        audioRef.current.load()

        // Set a timeout to try playing after loading
        const loadTimer = setTimeout(() => {
          if (audioRef.current && audioRef.current.readyState > 0) {
            tryPlayAudio()
          } else {
            console.warn("Audio still not loaded after delay")
          }
        }, 1000)

        return () => clearTimeout(loadTimer)
      } else {
        tryPlayAudio()
      }
    }

    function tryPlayAudio() {
      if (!audioRef.current) return

      try {
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsAudioPlaying(true)
              console.log("Audio started automatically")
            })
            .catch((error) => {
              console.error("Auto-play failed:", error)

              // Provide more specific guidance based on the error
              if (error.name === "NotAllowedError") {
                console.log("Browser blocked autoplay due to lack of user interaction")
              }

              // Don't show alert as it might be disruptive, just log to console
              console.log("User needs to click 'Play Audio' button to start the listening test")
            })
        }
      } catch (error) {
        console.error("Error auto-playing audio:", error)
      }
    }
  }, [currentSection, isTestActive, isAudioPlaying])

  const finishTest = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const readingScore = calculateReadingScore()
      const listeningScore = calculateListeningScore()
      const readingBandScore = calculateBandScore(readingScore, correctReadingAnswers.length)
      const listeningBandScore = calculateBandScore(listeningScore, correctListeningAnswers.length)

      // Calculate word counts for writing tasks
      const task1Words = writingAnswer1.split(/\s+/).filter((word) => word.length > 0).length
      const task2Words = writingAnswer2.split(/\s+/).filter((word) => word.length > 0).length

      const results = {
        student: currentUser,
        readingScore,
        readingTotal: correctReadingAnswers.length,
        readingPercentage: Math.round((readingScore / correctReadingAnswers.length) * 100),
        readingBand: readingBandScore,
        listeningScore,
        listeningTotal: correctListeningAnswers.length,
        listeningPercentage: Math.round((listeningScore / correctListeningAnswers.length) * 100),
        listeningBand: listeningBandScore,
        writingTask1: writingAnswer1 || "No response provided",
        writingTask1Words: task1Words,
        writingTask2: writingAnswer2 || "No response provided",
        writingTask2Words: task2Words,
        // No writing band score as requested
        // Calculate overall band score without writing
        overallBand: Math.round(((readingBandScore + listeningBandScore) / 2) * 10) / 10,
        completed: new Date().toLocaleString(),
      }

      // Store results locally in browser for backup
      storeLocalResults(results)

      const message = `
📊 *IELTS Test Results*

👤 *Student*: ${results.student}

📚 *Reading*: ${results.readingScore}/${results.readingTotal} (${results.readingPercentage}%) - Band ${results.readingBand.toFixed(1)}
🎧 *Listening*: ${results.listeningScore}/${results.listeningTotal} (${results.listeningPercentage}%) - Band ${results.listeningBand.toFixed(1)}

✍️ *Writing*:
Task 1: ${task1Words} words
Task 2: ${task2Words} words

🌟 *Overall Band Score*: ${results.overallBand.toFixed(1)}

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

      // Clear login session after test completion
      sessionStorage.removeItem("isLoggedIn")
    } catch (error) {
      console.error("Error submitting results:", error)
      setSubmitError(t("submit_error"))

      // Still complete the test even if there's an error
      setTimeout(() => {
        setIsTestComplete(true)
        setIsTestActive(false)
        // Clear login session after test completion
        sessionStorage.removeItem("isLoggedIn")
      }, 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours > 0 ? `${hours}:` : ""}${minutes < 10 && hours > 0 ? "0" : ""}${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`
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
    return readingAnswers.filter(
      (answer, index) => answer.toLowerCase().trim() === correctReadingAnswers[index].toLowerCase().trim(),
    ).length
  }

  const calculateListeningScore = () => {
    return listeningAnswers.filter(
      (answer, index) => answer.toLowerCase().trim() === correctListeningAnswers[index].toLowerCase().trim(),
    ).length
  }

  const renderReadingSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Reading Passage {currentPassage}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="ml-2">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passage on the left */}
        <div className="p-4 border rounded-md h-[600px] overflow-y-auto">
          <div className="prose dark:prose-invert max-w-none">
            {currentPassage === 1 && (
              <>
                <h2>The last man who knew everything</h2>
                <p>
                  In the 21st century, it would be quite impossible for even the most learned man to know everything.
                  However, as recently as the 18th century, there were those whose knowledge encompassed most of the
                  information available at that time. This is a review of a biography of one such man.
                </p>
                <p>
                  Thomas Young (1773–1829) contributed 63 articles to the great British encyclopaedia, Encyclopaedia
                  Britannica, including 46 biographical entries (mostly on scientists and classical scholars), and
                  substantial essays on 'Bridge' (a card game), 'Egypt', 'Languages' and 'Tides'. Was someone who could
                  write authoritatively about so many subjects a genius, or a dilettante?* In an ambitious biography,
                  Andrew Robinson argues that Young is a good contender to be described as 'the last man who knew
                  everything'. Young has competition, however: the phrase which Robinson uses as the title of his
                  biography of Young also serves as the subtitle of two other recent biographies: Leonard Warren's 1998
                  life of palaeontologist Joseph Leidy (1823–1891) and Paula Findlen's 2004 book on Athanasius Kircher
                  (1602–1680).
                </p>
                <p>
                  Young, of course, did more than write encyclopaedia entries. He presented his first paper, on the
                  human eye, to the prestigious academic institution, the Royal Society of London** at the age of 20 and
                  was elected a Fellow of the Society shortly afterwards. In the paper, which seeks to explain how the
                  eye focuses on objects at varying distances, Young hypothesised that this was achieved by changes in
                  the shape of the lens. He also theorised that light travels in waves, and believed that, to be able to
                  see in colour, there must be three receptors in the eye corresponding to the three 'principal colours'
                  (red, green and violet) to which the retina could respond. All these hypotheses were subsequently
                  proved to be correct. Later in his life, when he was in his forties, Young was instrumental in
                  cracking the code that unlocked the unknown script on the Rosetta Stone, a tablet found in Egypt by
                  the Napoleonic army in 1799. The stone has text in three alphabets: Greek, Egyptian hieroglyphs, and
                  something originally unrecognisable. The unrecognisable script is now known as 'demotic' and, as Young
                  deduced, is related directly to Egyptian hieroglyphs. His initial work on this appeared in the
                  Britannica entry 'Egypt'. In another entry, Young coined the term 'Indo-European' to describe the
                  family of languages spoken throughout most of Europe and northern India. These works are the landmark
                  achievements of a man who was a child prodigy but who, unlike many remarkable children, did not fade
                  into obscurity as an adult.
                </p>
                <p>
                  Born in 1773 in Somerset in England, Young lived with his maternal grandfather from an early age. He
                  devoured books from the age of two and excelled at Latin, Greek, mathematics and natural philosophy
                  (the 18th-century term for science). After leaving school, he was greatly encouraged by Richard
                  Brocklesby, a physician and Fellow of the Royal Society. Following Brocklesby's lead, Young decided to
                  pursue a career in medicine. He studied in London and then moved on to more formal education in
                  Edinburgh, Göttingen and Cambridge. After completing his medical training at the University of
                  Cambridge in 1808, Young set up practice as a physician in London and a few years later was appointed
                  physician at St. George's Hospital.
                </p>
                <p>
                  Young's skill as a physician, however, did not equal his talent as a scholar of natural philosophy or
                  linguistics. In 1801, he had been appointed to a professorship of natural philosophy at the Royal
                  Institution, where he delivered as many as 60 lectures a year. His opinions were requested by civic
                  and national authorities on matters such as the introduction of gas lighting to London streets and
                  methods of ship construction. From 1819, he was superintendent of the Nautical Almanac and secretary
                  to the Board of Longitude. Between 1816 and 1825, he contributed many entries to the Encyclopaedia
                  Britannica, and throughout his career he authored numerous other essays, papers and books.
                </p>
                <p>
                  Young is a perfect subject for a biography — perfect, but daunting. Few men contributed so much to so
                  many technical fields. Robinson's aim is to introduce non- scientists to Young's work and life. He
                  succeeds, providing clear expositions of the technical material (especially that on optics and
                  Egyptian hieroglyphs). Some readers of this book will, like Robinson, find Young's accomplishments
                  impressive; others will see him as some historians have — as a dilettante. Yet despite the rich
                  material presented in this book, readers will not end up knowing Young personally. We catch glimpses
                  of a playful Young, doodling Greek and Latin phrases in his notes on medical lectures and translating
                  the verses that a young lady had written on the walls of a summerhouse into Greek elegiacs. Young was
                  introduced into elite society, attended the theatre and learned to dance and play the flute. In
                  addition, he was an accomplished horseman. However, his personal life looks pale next to his vibrant
                  career and studies.
                </p>
                <p>
                  Young married Eliza Maxwell in 1804, and according to Robinson, 'their marriage was happy and she
                  appreciated his work'. Almost all we know about her is that she sustained her husband through some
                  rancorous disputes about optics and that she worried about money when his medical career was slow to
                  take off. Little evidence survives concerning the complexities of Young's relationships with his
                  mother and father. Robinson does not credit them with shaping Young's extraordinary mind. Despite the
                  lack of details concerning Young's relationships, however, anyone interested in what it means to be a
                  genius should read this book.
                </p>
              </>
            )}

            {currentPassage === 2 && (
              <>
                <h2>The fashion industry</h2>
                <p>
                  <strong>A</strong> The fashion industry is a multibillion-dollar global enterprise devoted to the
                  business of making and selling clothes. It encompasses all types of garments, from designer fashions
                  to ordinary everyday clothing. Because data on the industry are typically reported for national
                  economies, and expressed in terms of its many separate sectors, total figures for world production of
                  textiles* and clothing are difficult to obtain. However, by any measure, the industry accounts for a
                  significant share of world economic output.
                </p>
                <p>
                  <strong>B</strong> The fashion industry is a product of the modern age. Prior to the mid-19th century,
                  virtually all clothing was handmade for individuals, either as home production or on order from
                  dressmakers and tailors. By the beginning of the 20th century, with the development of new
                  technologies such as the sewing machine, the development of the factory system of production, and the
                  growth of department stores and other retail outlets, clothing had increasingly come to be
                  mass-produced in standard sizes, and sold at fixed prices. Although the fashion industry developed
                  first in Europe, today it is highly globalised, with garments often designed in one country,
                  manufactured in another, and sold in a third. For example, an American fashion company might source
                  fabric in China and have the clothes manufactured in Vietnam, finished in Italy, and shipped to a
                  warehouse in the United States for distribution to retail outlets internationally.
                </p>
                <p>
                  <strong>C</strong> One of the first accomplishments of the Industrial Revolution in the 18th century
                  was the partial automation of the spinning and weaving of wool, cotton, silk and other natural fibres.
                  Today, these processes are highly automated and carried out by computer-controlled, high-speed
                  machinery, and fabrics made from both natural fibres and synthetic fibres (such as nylon, acrylic, and
                  polyester) are produced. A growing interest in sustainable fashion (or 'eco-fashion') has led to
                  greater use of environmentally friendly fibres, such as hemp. In addition, high-tech synthetic fabrics
                  offer such properties as moisture absorption, stain resistance, retention or dissipation of body heat,
                  and protection against fire, weapons, cold, ultraviolet radiation, and other hazards. Fabrics are also
                  produced with a wide range of visual effects through dyeing, weaving, printing, and other processes.
                  Together with fashion forecasters, fabric manufacturers work well in advance of the clothing
                  production cycle, to create fabrics with colours, textures, and other qualities that anticipate
                  consumer demand.
                </p>
                <p>
                  <strong>D</strong> Historically, very few fashion designers have become famous brands such as Coco
                  Chanel or Calvin Klein, who have been responsible for prestigious high-fashion collections. These
                  designers are influential in the fashion world, but, contrary to popular belief, they do not dictate
                  new fashions; rather, they endeavour to design clothes that will meet consumer demand. The vast
                  majority of designers work in anonymity for manufacturers, as part of design teams, adapting designs
                  into marketable garments for average consumers. They draw inspiration from a wide range of sources,
                  including film and television costumes, street clothing, and active sportswear.
                </p>
                <p>
                  The fashion industry's traditional design methods, such as paper sketches and the draping of fabric on
                  mannequins, have been supplemented or replaced by computer- assisted design techniques. These allow
                  designers to rapidly make changes to a proposed design, and instantaneously share the proposed changes
                  with colleagues – whether they are in the next room or on another continent.
                </p>
                <p>
                  <strong>E</strong> An important stage in garment production is the translation of the clothing design
                  into templates, in a range of sizes, for cutting the cloth. Because the proportions of the human body
                  change with increases or decreases in weight, templates cannot simply be scaled up or down. Template
                  making was traditionally a highly skilled profession. Today, despite innovations in computer
                  programming, designs in larger sizes are difficult to adjust for every body shape. Whatever the size,
                  the template – whether drawn on paper or programmed as a set of computer instructions – determines how
                  fabric is cut into the pieces that will be joined to make a garment. For all but the most expensive
                  clothing, fabric cutting is accomplished by computer-guided knives or high- intensity lasers that can
                  cut many layers of fabric at once.
                </p>
                <p>
                  <strong>F</strong> The next stage of production is the assembly process. Some companies use their own
                  production facilities for some or all of the manufacturing process, but the majority rely on
                  separately owned manufacturing firms or contractors to produce garments to their specifications. In
                  the field of women's clothing, manufacturers typically produce several product lines a year, which
                  they deliver to retailers on predetermined dates. Technological innovation, including the development
                  of computer-guided machinery, has resulted in the automation of some stages of assembly. Nevertheless,
                  the fundamental process of sewing remains labour-intensive. In the late 20th century, China emerged as
                  the world's largest producer of clothing because of its low labour costs and highly disciplined
                  workforce.
                </p>
                <p>
                  Assembled items then go through various processes collectively known as 'finishing'. These include the
                  addition of decorative elements, fasteners, brand-name labels, and other labels (often legally
                  required) specifying fibre content, laundry instructions, and country of manufacture. Finished items
                  are then pressed and packed for shipment.
                </p>
                <p>
                  <strong>G</strong> For much of the period following World War II, trade in textiles and garments was
                  strictly regulated by purchasing countries, which imposed quotas and tariffs. Since the 1980s, these
                  protectionist measures, which were intended (ultimately without success) to prevent textile and
                  clothing production from moving from high-wage to low-wage countries, have gradually been abandoned.
                  They have been replaced by a free-trade approach, under the regulatory control of global
                  organisations. The advent of metal shipping containers and relatively inexpensive air freight have
                  also made it possible for production to be closely tied to market conditions, even across
                  globe-spanning distances.
                </p>
              </>
            )}

            {currentPassage === 3 && (
              <>
                <h2>How a prehistoric predator took to the skies</h2>
                <p>
                  Is that a bird in the sky? A plane? No, it's a pterosaur. Kate Thomas meets Professor Matthew
                  Wilkinson, who built a life-size model to find out how this prehistoric predator ever got off the
                  ground.
                </p>
                <p>
                  Pterosaurs existed from the Triassic period, 220 million years ago, to the end of the Cretaceous
                  period, 65 million years ago, when South America pulled away from Africa and the South Atlantic was
                  formed. They are among the least understood of all the extinct reptiles that once spent their lives in
                  the skies while the dinosaurs dominated the land. Pterosaurs had no feathers, but at least part of
                  their bodies was covered in hair, not unlike bats. Some believe this is an indication they were
                  warm-blooded. Researchers also debate whether pterosaurs travelled on the ground by walking on their
                  hind legs, like birds, or by using all fours, relying on their three-toed front feet as well as their
                  four-toed rear feet.
                </p>
                <p>
                  Pterosaurs were vertebrates, meaning they were the first species possessing backbones to become
                  airborne, but scientists have never quite understood their flight technique. How, they wondered, did
                  such a heavy creature ever manage to take off? How could a wing that appears to have been supported by
                  fine, hollow bones have carried one into the sky? Then came the discovery of a site in Brazil's
                  Araripe basin. Here, not only were hundreds of fossils of amphibians* and other reptiles found, but
                  archaeologists unearthed a number of very well-preserved pterosaurs. The anhanguera – a fish-eating
                  sub-species of pterosaur that ruled the skies in the Cretaceous period – was among them. With a
                  wingspan of up to 12 metres, they would have made an amazing sight in the sky – had any human been
                  there to witness it. 'I've been studying pterosaurs for about eight years now,' says Dr Matthew
                  Wilkinson, a professor of zoology at Cambridge University. With an anhanguera fossil as his model,
                  Wilkinson began gradually reconstructing its skeletal structure in his Cambridge studio. The
                  probability of finding three-dimensional pterosaur fossils anywhere is slim. 'That was quite a find,'
                  he says. 'Their bones are usually crushed to dust.' Once the structure was complete, it inspired him
                  to make a robot version as a way to understand the animal's locomotion. With a team of model-makers,
                  he has built a remote-controlled pterosaur in his studio. 'Fossils show just how large these creatures
                  were. I've always been interested in how they managed to launch themselves, so I thought the real test
                  would be to actually build one and fly it.'
                </p>
                <p>
                  Wilkinson hasn't been alone in his desire to recreate a prehistoric beast. Swiss scientists recently
                  announced they had built an amphibious robot that could walk on land and swim in water using the sort
                  of backbone movements that must have been employed by the first creatures to crawl from the sea. But
                  Wilkinson had the added complication of working out his beast's flight technique. Unlike those of bats
                  or flying squirrels, pterosaur wings – soft, stretchy membranes of skin tissue – are thought to have
                  reached from the chest right to the ankle, reinforced by fibres that stiffened the wing and prevented
                  tearing. Smaller subspecies flapped their wings during takeoff. That may have explained the creatures'
                  flexibility, but it did not answer the most pressing question: how did such heavy animals manage to
                  launch themselves into the sky? Working with researchers in London and Berlin, Wilkinson began to
                  piece together the puzzle.
                </p>
                <p>
                  It emerged that the anhanguera had an elongated limb called the pteroid. It had previously been
                  thought the pteroid pointed towards the shoulder of the creature and supported a soft forewing in
                  front of the arm. But if that were the case, the forewing would have been too small and ineffectual
                  for flight. However, to the surprise of many scientists, fossils from the Araripe basin showed the
                  pteroid possibly faced the opposite way, creating a much greater forewing that would have caught the
                  air, working in the same way as the flaps on the wings of an aeroplane. So, with both feet on the
                  ground, the anhanguera might have simply faced into the wind, spread its wings and risen up into the
                  sky. Initial trials in wind tunnels proved the point – models of pterosaurs with forward-facing
                  pteroids were not only adept at gliding, but were agile flyers in spite of their size. 'This high-lift
                  capability would have significantly reduced the minimum flight speed, allowing even the largest forms
                  to take off without difficulty,' Wilkinson says. 'It would have enabled them to glide very slowly and
                  may have been instrumental in the evolution of large size by the pterosaurs.'
                </p>
                <p>
                  Resting in the grass at the test site near Cambridge, the robot-model's wings ripple in the wind. In
                  flight, the flexible membrane, while much stiffer than the real thing, allows for a smooth takeoff and
                  landing. But the model has been troubled by other mechanical problems. 'Unlike an aircraft, which is
                  stabilised by the tail wing at the back, the model is stabilised by its head, which means it can start
                  spinning around. That's the most problematic bit as far as we're concerned,' Wilkinson says. 'We've
                  had to take it flying without the head so far.' When it flies with its head attached, Wilkinson will
                  finally have proved his point.
                </p>
                <p>
                  So what's next for the zoologist – perhaps a full-size Tyrannosaurus rex? 'No,' he tells me. 'We're
                  desperate to build really big pterosaurs. I'm talking creatures with even greater wingspans, weighing
                  a quarter of a ton. But,' he adds, just as one begins to fear for the safety and stress levels of
                  pilots landing nearby at Cambridge City Airport, 'it's more likely we'll start off with one of the
                  smaller, flapping pterosaurs.' This is certainly more reassuring. Let's hope he is content to leave it
                  at that.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Questions on the right */}
        <div className="p-4 border rounded-md h-[600px] overflow-y-auto">
          <div className="space-y-6 text-lg">
            {currentPassage === 1 && (
              <>
                <h3 className="text-xl font-semibold">Questions 1-7</h3>
                <p className="mb-4">Do the following statements agree with the information given in Reading Passage 1?</p>
                <p className="mb-2">
                  In boxes 1-7 on your answer sheet, write:
                  <br />
                  <strong>TRUE</strong> if the statement agrees with the information
                  <br />
                  <strong>FALSE</strong> if the statement contradicts the information
                  <br />
                  <strong>NOT GIVEN</strong> if there is no information on this
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">1. Other people have been referred to as 'the last man who knew everything'.</p>
                    <Input
                      value={readingAnswers[0]}
                      onChange={(e) => handleReadingAnswerChange(0, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">2. The fact that Young's childhood brilliance continued into adulthood was normal.</p>
                    <Input
                      value={readingAnswers[1]}
                      onChange={(e) => handleReadingAnswerChange(1, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">3. Young's talents as a doctor are described as surpassing his other skills.</p>
                    <Input
                      value={readingAnswers[2]}
                      onChange={(e) => handleReadingAnswerChange(2, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">4. Young's advice was sought by several bodies responsible for local and national matters.</p>
                    <Input
                      value={readingAnswers[3]}
                      onChange={(e) => handleReadingAnswerChange(3, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">5. All Young's written works were published in the Encyclopaedia Britannica.</p>
                    <Input
                      value={readingAnswers[4]}
                      onChange={(e) => handleReadingAnswerChange(4, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">6. Young was interested in a range of social pastimes.</p>
                    <Input
                      value={readingAnswers[5]}
                      onChange={(e) => handleReadingAnswerChange(5, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">7. Young suffered from poor health in his later years.</p>
                    <Input
                      value={readingAnswers[6]}
                      onChange={(e) => handleReadingAnswerChange(6, e.target.value)}
                      placeholder="TRUE / FALSE / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6">Questions 8-13</h3>
                <p className="mb-4">
                  Answer the questions below.
                  <br />
                  Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">8. How many life stories did Thomas Young write for the Encyclopaedia Britannica?</p>
                    <Input
                      value={readingAnswers[7]}
                      onChange={(e) => handleReadingAnswerChange(7, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">9. What was the subject of Thomas Young's first academic paper?</p>
                    <Input
                      value={readingAnswers[8]}
                      onChange={(e) => handleReadingAnswerChange(8, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">10. What name did Young give to a group of languages?</p>
                    <Input
                      value={readingAnswers[9]}
                      onChange={(e) => handleReadingAnswerChange(9, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">11. Who inspired Young to enter the medical profession?</p>
                    <Input
                      value={readingAnswers[10]}
                      onChange={(e) => handleReadingAnswerChange(10, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">12. At which place of higher learning did Young hold a teaching position?</p>
                    <Input
                      value={readingAnswers[11]}
                      onChange={(e) => handleReadingAnswerChange(11, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">13. What was the improvement to London roads on which Young's ideas were sought?</p>
                    <Input
                      value={readingAnswers[12]}
                      onChange={(e) => handleReadingAnswerChange(12, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Similar changes for passage 2 and 3 questions - adding the same styling */}
            {currentPassage === 2 && (
              <>
                <h3 className="text-xl font-semibold">Questions 14-20</h3>
                <p className="mb-4">
                  Reading Passage 2 has seven sections, A-G.
                  <br />
                  Choose the correct heading for each section from the list of headings below.
                </p>

                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md mb-4">
                  <p className="font-medium text-lg">List of Headings</p>
                  <ol className="list-roman pl-5 mt-2 text-lg">
                    <li>How new clothing styles are created</li>
                    <li>The rise of the fashion industry</li>
                    <li>Joining the garment pieces together</li>
                    <li>Producing materials with a range of features</li>
                    <li>The importance of the fashion industry</li>
                    <li>Factors affecting international commerce</li>
                    <li>The attractions of becoming a fashion model</li>
                    <li>Making patterns for people with different figures</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">14. Section A</p>
                    <Input
                      value={readingAnswers[13]}
                      onChange={(e) => handleReadingAnswerChange(13, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">15. Section B</p>
                    <Input
                      value={readingAnswers[14]}
                      onChange={(e) => handleReadingAnswerChange(14, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">16. Section C</p>
                    <Input
                      value={readingAnswers[15]}
                      onChange={(e) => handleReadingAnswerChange(15, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">17. Section D</p>
                    <Input
                      value={readingAnswers[16]}
                      onChange={(e) => handleReadingAnswerChange(16, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">18. Section E</p>
                    <Input
                      value={readingAnswers[17]}
                      onChange={(e) => handleReadingAnswerChange(17, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">19. Section F</p>
                    <Input
                      value={readingAnswers[18]}
                      onChange={(e) => handleReadingAnswerChange(18, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">20. Section G</p>
                    <Input
                      value={readingAnswers[19]}
                      onChange={(e) => handleReadingAnswerChange(19, e.target.value)}
                      placeholder="Enter heading number (i-viii)"
                      className="mt-2"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6">Questions 21-24</h3>
                <p className="mb-4">
                  Complete the summary below.
                  <br />
                  Choose NO MORE THAN TWO WORDS from the passage for each answer.
                </p>

                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md mb-4">
                  <p className="font-medium text-lg">The development of a modern fashion industry</p>
                  <p className="mt-2 text-lg">
                    Up until the middle of the 19th century, people generally wore handmade clothes. After that the
                    situation changed, and by the 20th century many clothes were mass produced. This development was
                    partly due to inventions like the 21 ........................... It was also the result of general
                    changes in manufacturing systems, as well as the spread of shops like 22 ................... The
                    changes also led to the standardisation of sizes and 23 ........................... Today, despite the
                    fact that the fashion industry originated in 24 ........................... it has become a truly
                    international enterprise.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">21.</p>
                    <Input
                      value={readingAnswers[20]}
                      onChange={(e) => handleReadingAnswerChange(20, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">22.</p>
                    <Input
                      value={readingAnswers[21]}
                      onChange={(e) => handleReadingAnswerChange(21, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">23.</p>
                    <Input
                      value={readingAnswers[22]}
                      onChange={(e) => handleReadingAnswerChange(22, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">24.</p>
                    <Input
                      value={readingAnswers[23]}
                      onChange={(e) => handleReadingAnswerChange(23, e.target.value)}
                      placeholder="Answer"
                      className="mt-2"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6">Questions 25 and 26</h3>
                <p className="mb-4 text-lg">Choose TWO letters, A-E.</p>
                <p className="mb-4 text-lg">Which TWO of the following statements does the writer make about garment assembly?</p>

                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md mb-4">
                  <div className="space-y-2 text-lg">
                    <div className="flex items-start gap-2">
                      <span className="font-medium">A.</span>
                      <p>The majority of sewing is done by computer-operated machines.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">B.</span>
                      <p>Highly skilled workers are the most important requirement.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">C.</span>
                      <p>Most businesses use other companies to manufacture their products.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">D.</span>
                      <p>Fasteners and labels are attached after the clothes have been made up.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">E.</span>
                      <p>Manufacturers usually produce one range of women's clothing annually.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">25. First choice</p>
                    <Input
                      value={readingAnswers[24]}
                      onChange={(e) => handleReadingAnswerChange(24, e.target.value)}
                      placeholder="Enter letter (A-E)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">26. Second choice</p>
                    <Input
                      value={readingAnswers[25]}
                      onChange={(e) => handleReadingAnswerChange(25, e.target.value)}
                      placeholder="Enter letter (A-E)"
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}

            {currentPassage === 3 && (
              <>
                <h3 className="text-xl font-semibold">Questions 27-32</h3>
                <p className="mb-4 text-lg">Complete the summary using the list of words, A-L, below.</p>

                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md mb-4">
                  <p className="mb-2 text-lg">
                    Pterosaurs are believed to have existed until the end of the Cretaceous period. They are classed as 27
                    ......................... which were capable of flight, although, unlike modern species, they had some
                    28 ......................... which is evidence of their having had warm blood.
                  </p>
                  <p className="mb-2 text-lg">
                    There are two theories as to how they moved on land: perhaps with all their feet or by using their
                    29.......................... only. Another mystery has concerned the ability of the pterosaur to fly
                    despite its immense 30 .......................... and the fact that the bones making up the wing did
                    not have great 31 .......................... Thanks to reptile fossils found in Brazil, we now know
                    that the subspecies known as anhanguera had wings that were 12 metres across and that it mainly
                    survived on 32 ..................
                  </p>
                </div>

                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-lg">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">A</span>
                      <p>front feet</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">B</span>
                      <p>fish</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">C</span>
                      <p>dinosaurs</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">D</span>
                      <p>reptiles</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">E</span>
                      <p>flexibility</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">F</span>
                      <p>hind legs</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">G</span>
                      <p>amphibians</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">H</span>
                      <p>birds</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">I</span>
                      <p>strength</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">J</span>
                      <p>weight</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">K</span>
                      <p>tail</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">L</span>
                      <p>hair</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">27.</p>
                    <Input
                      value={readingAnswers[26]}
                      onChange={(e) => handleReadingAnswerChange(26, e.target.value)}
                      placeholder="Enter letter (A-L)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">28.</p>
                    <Input
                      value={readingAnswers[27]}
                      onChange={(e) => handleReadingAnswerChange(27, e.target.value)}
                      placeholder="Enter letter (A-L)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">29.</p>
                    <Input
                      value={readingAnswers[28]}
                      onChange={(e) => handleReadingAnswerChange(28, e.target.value)}
                      placeholder="Enter letter (A-L)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">30.</p>
                    <Input
                      value={readingAnswers[29]}
                      onChange={(e) => handleReadingAnswerChange(29, e.target.value)}
                      placeholder="Enter letter (A-L)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">31.</p>
                    <Input
                      value={readingAnswers[30]}
                      onChange={(e) => handleReadingAnswerChange(30, e.target.value)}
                      placeholder="Enter letter (A-L)"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">32.</p>
                    <Input
                      value={readingAnswers[31]}
                      onChange={(e) => handleReadingAnswerChange(31, e.target.value)}
                      placeholder="Enter letter (A-L)"
                      className="mt-2"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6">Questions 33-36</h3>
                <p className="mb-4 text-lg">
                  Do the following statements agree with the claims of the writer in Reading Passage 3?
                </p>
                <p className="mb-2 text-lg">
                  In boxes 33-36 on your answer sheet, write:
                  <br />
                  <strong>YES</strong> if the statement agrees with the claims of the writer
                  <br />
                  <strong>NO</strong> if the statement contradicts the claims of the writer
                  <br />
                  <strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">33. It is rare to find a fossil of a pterosaur that clearly shows its skeleton.</p>
                    <Input
                      value={readingAnswers[32]}
                      onChange={(e) => handleReadingAnswerChange(32, e.target.value)}
                      placeholder="YES / NO / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">34. The reason for building the model was to prove pterosaurs flew for long distances.</p>
                    <Input
                      value={readingAnswers[33]}
                      onChange={(e) => handleReadingAnswerChange(33, e.target.value)}
                      placeholder="YES / NO / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">35. It is possible that pterosaur species achieved their wing size as a result of the pteroid.</p>
                    <Input
                      value={readingAnswers[34]}
                      onChange={(e) => handleReadingAnswerChange(34, e.target.value)}
                      placeholder="YES / NO / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">36. Wilkinson has made several unsuccessful replicas of the pterosaur's head.</p>
                    <Input
                      value={readingAnswers[35]}
                      onChange={(e) => handleReadingAnswerChange(35, e.target.value)}
                      placeholder="YES / NO / NOT GIVEN"
                      className="mt-2"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6">Questions 37-40</h3>
                <p className="mb-4 text-lg">Choose the correct letter, A, B, C or D.</p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">37. What was Professor Wilkinson's main problem, according to the third paragraph?</p>
                    <div className="space-y-2 mt-2 text-lg">
                      <div className="flex items-start gap-2">
                        <span className="font-medium">A</span>
                        <p>Early amphibians had a more complex structure than pterosaurs.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">B</span>
                        <p>Pterosaur wings could easily be damaged while on the ground.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">C</span>
                        <p>Flying squirrels and bats were better adapted to flying than pterosaurs.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">D</span>
                        <p>Large pterosaurs were not able to take off like other flying animals.</p>
                      </div>
                    </div>
                    <Input
                      value={readingAnswers[36]}
                      onChange={(e) => handleReadingAnswerChange(36, e.target.value)}
                      placeholder="Enter letter (A-D)"
                      className="mt-3"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">38. What did Professor Wilkinson discover about a bone in pterosaurs called a pteroid?</p>
                    <div className="space-y-2 mt-2 text-lg">
                      <div className="flex items-start gap-2">
                        <span className="font-medium">A</span>
                        <p>It was in an unexpected position.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">B</span>
                        <p>It existed only in large species of pterosaurs.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">C</span>
                        <p>It allowed pterosaurs to glide rather than fly.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">D</span>
                        <p>It increased the speed pterosaurs could reach in the air.</p>
                      </div>
                    </div>
                    <Input
                      value={readingAnswers[37]}
                      onChange={(e) => handleReadingAnswerChange(37, e.target.value)}
                      placeholder="Enter letter (A-D)"
                      className="mt-3"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">39. According to the writer, the main problem with the remote-controlled 'pterosaur' is that</p>
                    <div className="space-y-2 mt-2 text-lg">
                      <div className="flex items-start gap-2">
                        <span className="font-medium">A</span>
                        <p>it has been unable to leave the ground so far.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">B</span>
                        <p>it cannot be controlled when its head is attached.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">C</span>
                        <p>its wing material is not flexible enough.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">D</span>
                        <p>the force of the wind may affect its test results.</p>
                      </div>
                    </div>
                    <Input
                      value={readingAnswers[38]}
                      onChange={(e) => handleReadingAnswerChange(38, e.target.value)}
                      placeholder="Enter letter (A-D)"
                      className="mt-3"
                    />
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-md">
                    <p className="text-lg">40. What does 'it' in the last sentence refer to?</p>
                    <div className="space-y-2 mt-2 text-lg">
                      <div className="flex items-start gap-2">
                        <span className="font-medium">A</span>
                        <p>The information the tests have revealed</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">B</span>
                        <p>Wilkinson's sense of achievement</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">C</span>
                        <p>Wilkinson's desire to build models</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium">D</span>
                        <p>The comparison between types of models</p>
                      </div>
                    </div>
                    <Input
                      value={readingAnswers[39]}
                      onChange={(e) => handleReadingAnswerChange(39, e.target.value)}
                      placeholder="Enter letter (A-D)"
                      className="mt-3"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>\
