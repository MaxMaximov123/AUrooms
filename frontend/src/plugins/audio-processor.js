class EchoProcessor extends AudioWorkletProcessor {
    process(inputs, outputs) {
      const input = inputs[0];
      const output = outputs[0];
  
      if (input && input[0]) {
        for (let i = 0; i < input[0].length; i++) {
          output[0][i] = input[0][i]; // Передача звука без изменений
        }
      }
  
      return true; // Поддержка постоянного выполнения
    }
  }
  
  registerProcessor('echo-processor', EchoProcessor);