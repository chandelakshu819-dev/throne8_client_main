'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

export interface VoiceState {
  isRecording: boolean
  isSupported: boolean
  transcript:  string
  interim:     string
  error:       string | null
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useVoiceInput(onChange?: (text: string) => void) {
  const [state, set] = useState<VoiceState>({ isRecording: false, isSupported: false, transcript: '', interim: '', error: null })
  const recRef  = useRef<any>(null)
  const finalRef = useRef('')

  useEffect(() => {
    set(s => ({ ...s, isSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition) }))
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      let interim = '', final = finalRef.current
      for (let i = e.resultIndex; i < e.results.length; i++) {
        e.results[i].isFinal ? (final += e.results[i][0].transcript + ' ') : (interim += e.results[i][0].transcript)
      }
      finalRef.current = final
      set(s => ({ ...s, transcript: final, interim }))
      onChange?.(final)
    }
    rec.onerror = (e: any) => set(s => ({ ...s, error: e.error, isRecording: false }))
    rec.onend   = () => set(s => ({ ...s, isRecording: false, interim: '' }))
    recRef.current = rec
    finalRef.current = ''
    rec.start()
    set(s => ({ ...s, isRecording: true, error: null, transcript: '', interim: '' }))
  }, [onChange])

  const stop  = useCallback(() => { recRef.current?.stop(); set(s => ({ ...s, isRecording: false, interim: '' })) }, [])
  const clear = useCallback(() => { finalRef.current = ''; set(s => ({ ...s, transcript: '', interim: '' })) }, [])

  useEffect(() => () => recRef.current?.stop(), [])

  return { ...state, start, stop, clear }
}