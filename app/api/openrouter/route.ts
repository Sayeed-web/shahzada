import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_MODELS = [
  {
    name: "DeepSeek R1 0528 (free)",
    model: "deepseek/deepseek-r1-0528:free",
    key: "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"
  },
  {
    name: "Google Gemini 2.5 Flash Image Preview (free)",
    model: "google/gemini-2.5-flash-image-preview:free",
    key: "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"
  },
  {
    name: "OpenAI gpt-oss-120b (free)",
    model: "openai/gpt-oss-120b:free",
    key: "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"
  },
  {
    name: "Google Gemini 2.5 Pro Experimental",
    model: "google/gemini-2.5-pro-exp-03-25",
    key: "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"
  },
  {
    name: "Meta LLaMA 3.3 8B Instruct (free)",
    model: "meta-llama/llama-3.3-8b-instruct:free",
    key: "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"
  }
]

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Select model or use default
    const selectedModel = OPENROUTER_MODELS.find(m => m.model === model) || OPENROUTER_MODELS[0]
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selectedModel.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel.model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      return NextResponse.json({
        response: data.choices[0].message.content,
        model: selectedModel.name
      })
    } else {
      return NextResponse.json({ error: 'No response from AI model' }, { status: 500 })
    }
  } catch (error) {
    console.error('OpenRouter API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    models: OPENROUTER_MODELS.map(m => ({
      name: m.name,
      model: m.model
    }))
  })
}