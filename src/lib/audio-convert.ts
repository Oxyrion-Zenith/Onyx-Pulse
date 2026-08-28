import lamejs from "lamejs";

function floatTo16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, length, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c]?.[i] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export function audioBufferToMp3(
  buffer: AudioBuffer,
  onProgress?: (n: number) => void,
): Blob {
  const channels = buffer.numberOfChannels >= 2 ? 2 : 1;
  const encoder = new lamejs.Mp3Encoder(channels, buffer.sampleRate, 192);
  const left = floatTo16(buffer.getChannelData(0));
  const right = channels === 2 ? floatTo16(buffer.getChannelData(1)) : undefined;
  const block = 1152;
  const parts: Int8Array[] = [];
  for (let i = 0; i < left.length; i += block) {
    const l = left.subarray(i, i + block);
    const r = right ? right.subarray(i, i + block) : undefined;
    const chunk = r ? encoder.encodeBuffer(l, r) : encoder.encodeBuffer(l);
    if (chunk.length > 0) parts.push(chunk);
    onProgress?.(Math.min(1, i / left.length));
  }
  const flush = encoder.flush();
  if (flush.length > 0) parts.push(flush);
  onProgress?.(1);
  return new Blob(parts as unknown as BlobPart[], { type: "audio/mpeg" });
}

export async function decodeMediaFile(file: Blob): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  try {
    const data = await file.arrayBuffer();
    return await ctx.decodeAudioData(data.slice(0));
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export async function convertToAudio(
  file: Blob,
  format: "mp3" | "wav",
  onProgress?: (n: number) => void,
): Promise<{ blob: Blob; mime: string; ext: string }> {
  onProgress?.(0.05);
  const audio = await decodeMediaFile(file);
  onProgress?.(0.4);
  if (format === "wav") {
    const blob = audioBufferToWav(audio);
    onProgress?.(1);
    return { blob, mime: "audio/wav", ext: "wav" };
  }
  const blob = audioBufferToMp3(audio, (n) => onProgress?.(0.4 + n * 0.6));
  return { blob, mime: "audio/mpeg", ext: "mp3" };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
