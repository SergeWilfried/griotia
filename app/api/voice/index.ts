import { NextRequest, NextResponse } from "next/server";
import { ModelProvider } from "@/app/constant";
import { auth } from "@/app/api/auth";
async function handle(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }
  const {voice_id, text,use_speaker_boost} = req.body as any
  const voice_settings = {"similarity_boost":123,"stability":123,"style":123,"use_speaker_boost":true}
  const model_id = '';
  const version_id = '';
  const pronunciation_dictionary_locators = [{"pronunciation_dictionary_id":"<string>","version_id":version_id}];

  const authResult = auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"model_id":model_id,"pronunciation_dictionary_locators":pronunciation_dictionary_locators,"text":text,voice_settings:voice_settings})
      };
      
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, options)
        .then(response => response.json())
        .then(response => {
            return NextResponse.json(
                response,
                {
                  status: 200,
                },
              );
        })
        .catch(err => console.error(err));
   
  } catch (e) {
    return NextResponse.json(
      {
        error: true,
        msg: (e as Error).message,
      },
      {
        status: 500,
      },
    );
  }
}

export const POST = handle;

export const runtime = "nodejs";
