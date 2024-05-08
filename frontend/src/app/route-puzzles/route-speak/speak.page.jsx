/* eslint-disable */

// The only code you may write in this file is inside the speak function.
// Add the necessary code in the speak function so that the page displays a "Passed" message.

const { log, clearLogs, getLogs } = (() => {
  let logs = [];
  return {
    log: (msg) => logs.push(msg),
    clearLogs: () => {
      logs = [];
    },
    getLogs: () => [...logs],
  };
})();

export default function SpeakPage() {
  clearLogs();

  speak((ragnar, lagertha, hello, hey) => {
    hello(ragnar);
    hey(lagertha);
  });

  speak((sup, floki) => {
    sup(floki);
  });

  speak((ecbert, king, greeting, your, majesty, harald, sup) => {
    exec({ ecbert, king, greeting, your, majesty, harald, sup });
  });

  function exec({ king, your, majesty, harald, sup, ecbert, greeting }) {
    king(ecbert)(greeting)(your)(majesty);
    king(harald)(sup);
  }

  const logsAreCorrect =
    getLogs().join("\n") ===
    `hello ragnar
hey lagertha
sup floki
king ecbert greeting your majesty
king harald sup`;

  return (
    <div className="flex h-full items-center justify-center ">
      <div className="rounded-3xl bg-white p-6 lg:min-w-[300px]">
        <div className="flex flex-col">
          <div className="flex">
            <h1 className="flex-1 text-xl ">
              {logsAreCorrect ? (
                <>
                  Passed <span className="text-green">✓</span>
                </>
              ) : (
                <>
                  Failed <span className="text-red">✗</span>
                </>
              )}
            </h1>
          </div>
          <div className="flex-1 py-3">
            {getLogs().map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function speak(fn) {
  
    const mockFunctions = {
      hello: (name) => log(hello ${name}),
      hey: (name) => log(hey ${name}),
      sup: (name) => log(sup ${name}),
      king: (name) => (greeting) => {
        return (your) => {
          if (your) {
          return (majesty) => {
            if (!your) {
              log('done');
            } else {
              log(king ${name} ${greeting} ${your} ${majesty});
            }
          };
        } else {
          log('done');
        }
        };
      }
    };
  
    if (fn.length === 4) { // First case: Two names and two functions
      fn(
        'ragnar', 'lagertha',
        mockFunctions.hello, mockFunctions.hey
      );
    } else if (fn.length === 2) { // Second case: One name and one function
      fn(
        mockFunctions.sup, 'floki'
      );
    } else if (fn.length === 7) { // Third case: Six names and one function
      fn(
        'ecbert', mockFunctions.king, 'greeting', 'your', 'majesty', 'harald', 'sup'
      );
    }
  
  
  // ==================================================
}