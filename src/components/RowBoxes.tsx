import { useEffect, useRef, useState } from "react";

export interface RowBoxesProps {
  rowIndex: number;
  isActive: boolean;
  isComplete: boolean;
  targetWord: string;
  wordLength: number;
  onComplete: (rowIndex: number, values: string[]) => void;
  completedValues?: string[];
  onFirstInput: () => void;
  resetTrigger: number;
}

export function RowBoxes({
  rowIndex,
  isActive,
  isComplete,
  targetWord,
  wordLength,
  onComplete,
  completedValues,
  onFirstInput,
  resetTrigger,
}: RowBoxesProps) {
  const [currentColumn, setCurrentColumn] = useState(0);
  const [inputValues, setInputValues] = useState<string[]>(
    completedValues || Array(wordLength).fill("")
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [hasTriggeredFirstInput, setHasTriggeredFirstInput] = useState(false);

  useEffect(() => {
    setInputValues(Array(wordLength).fill(""));
    setCurrentColumn(0);
    setHasTriggeredFirstInput(false);
  }, [resetTrigger, wordLength]);

  const getBoxColor = (index: number, value: string) => {
    if (!isComplete || !value)
      return "bg-background/10 backdrop-blur-sm border-background/30";

    const targetChar = targetWord[index];
    if (value === targetChar) {
      return "bg-green-500/80 backdrop-blur-sm border-green-400/50";
    } else if (targetWord.includes(value)) {
      return "bg-yellow-500/80 backdrop-blur-sm border-yellow-400/50";
    } else {
      return "bg-gray-500/80 backdrop-blur-sm border-gray-400/50";
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (!hasTriggeredFirstInput && value && isActive) {
      onFirstInput();
      setHasTriggeredFirstInput(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const cleanValue = value
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .slice(0, 1);

    const newValues = [...inputValues];
    newValues[index] = cleanValue;
    setInputValues(newValues);

    if (cleanValue && index < wordLength - 1) {
      const nextIndex = index + 1;
      setCurrentColumn(nextIndex);
      const timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 0);

      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
      });
    }

    if (cleanValue && index === wordLength - 1) {
      onComplete(rowIndex, newValues);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (e.key === "Backspace") {
      e.preventDefault();

      if (inputValues[index]) {
        const newValues = [...inputValues];
        newValues[index] = "";
        setInputValues(newValues);
        setCurrentColumn(index);
      } else if (index > 0) {
        const prevIndex = index - 1;
        const newValues = [...inputValues];
        newValues[prevIndex] = "";
        setInputValues(newValues);
        setCurrentColumn(prevIndex);
        const timeoutId = setTimeout(() => {
          if (!signal.aborted) {
            inputRefs.current[prevIndex]?.focus();
          }
        }, 0);

        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
        });
      }
    } else if (e.key === "Delete") {
      e.preventDefault();

      if (inputValues[index]) {
        const newValues = [...inputValues];
        newValues[index] = "";
        setInputValues(newValues);
        setCurrentColumn(index);
      } else if (index < wordLength - 1) {
        const nextIndex = index + 1;
        const newValues = [...inputValues];
        newValues[nextIndex] = "";
        setInputValues(newValues);
        setCurrentColumn(nextIndex);
        const timeoutId = setTimeout(() => {
          if (!signal.aborted) {
            inputRefs.current[nextIndex]?.focus();
          }
        }, 0);

        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
        });
      }
    } else if (e.key === "Enter" && inputValues.every((val) => val !== "")) {
      onComplete(rowIndex, inputValues);
    }
  };

  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

  useEffect(() => {
    if (isActive && !isComplete) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          inputRefs.current[0]?.focus();
        }
      }, 100);

      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
      });
    }
  }, [isActive, isComplete]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div
      className={`grid gap-4`}
      style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: wordLength }, (_, index) => (
        <input
          key={index}
          ref={setInputRef(index)}
          className={`${getBoxColor(
            index,
            inputValues[index]
          )} text-background h-16 w-16 text-2xl font-bold text-center border-2 focus:border-background/70 focus:outline-none transition-all duration-200 drop-shadow-lg`}
          disabled={
            !isActive || isComplete || (isActive && index > currentColumn)
          }
          value={inputValues[index]}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          maxLength={1}
        />
      ))}
    </div>
  );
}
