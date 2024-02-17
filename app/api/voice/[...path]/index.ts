import { NextRequest, NextResponse } from "next/server";
import { ModelProvider } from "@/app/constant";
import { auth } from "@/app/api/auth";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

async function handle(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }
  const path = req.headers.get("x-goog-api-key") ?? "";

  const { text, use_speaker_boost } = req.body as any;
 

  const authResult = auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const options = createOptions(use_speaker_boost, text);
    const response = await fetchTextToSpeech(options);
    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    return NextResponse.json({
      error: true,
      msg: (e as Error).message,
    }, {
      status: 500,
    });
  }
}

function createOptions(use_speaker_boost: boolean, text: string) {
    const voice_settings = { "similarity_boost": 123, "stability": 123, "style": 123, "use_speaker_boost": use_speaker_boost };
    const model_id = '';
    const version_id = '';
    const voice_id = '';
    const pronunciation_dictionary_id = '';
    const pronunciation_dictionary_locators = [{ "pronunciation_dictionary_id": pronunciation_dictionary_id, "version_id": version_id }];
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ "model_id": model_id, "pronunciation_dictionary_locators": pronunciation_dictionary_locators, "text": text, voice_settings: voice_settings })
  };
}

async function fetchTextToSpeech(options: any) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${options.voice_id}/stream`, options);
  return await response.json();
}

const serviceRegion = "eastus"; // 例如 "westus"

function convertTextToSpeech(text: string) {
  let subscriptionKey = process.env.OPENAI_ORG_ID || "";
  // 创建语音识别器
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    subscriptionKey,
    serviceRegion,
  );
  return new Promise((resolve, reject) => {
    speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoshuangNeural"; // 使用 Azure 提供的声音名列表，选择合适的声音

    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput(); // 设置音频输出来自默认扬声器

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve("Speech synthesis completed successfully.");
        } else {
          reject(`Text to speech failed. Reason: ${result.reason}`);
        }
        synthesizer.close();
      },
      (error) => {
        console.error(error);
        synthesizer.close();
        reject(error);
      },
    );
  });
}


function recognizeSpeech(): Promise<string> {
  let subscriptionKey = process.env.OPENAI_ORG_ID || "";
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    subscriptionKey,
    serviceRegion,
  );

  // 设置语音识别的语言
  speechConfig.speechRecognitionLanguage = "zh-CN";

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
  return new Promise<string>((resolve, reject) => {
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    console.log("开始语音识别，请说话...");
    recognizer.recognizeOnceAsync(
      (result) => {
        console.log(`识别结果： ${result.text}`);
        recognizer.close();
        resolve(result.text);
      },
      (err) => {
        console.trace("出现错误： ", err);
        recognizer.close();
        reject(err);
      },
    );
  });
}
export const POST = handle;

export const runtime = "nodejs";

