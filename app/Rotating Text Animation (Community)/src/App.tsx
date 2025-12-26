export default function App() {
  const text = "CIRCULAR ROTATING TEXT • ";
  const characters = text.split("");
  const radius = 120;
  
  return (
    <div className="size-full flex items-center justify-center bg-background">
      <div className="relative w-80 h-80 flex items-center justify-center">
        <div 
          className="relative w-full h-full"
          style={{
            animation: 'rotate 10s linear infinite'
          }}
        >
          {characters.map((char, index) => {
            const angle = (index / characters.length) * 360;
            return (
              <span
                key={index}
                className="absolute text-2xl font-medium text-primary"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `
                    translate(-50%, -50%)
                    rotate(${angle}deg)
                    translateY(-${radius}px)
                  `,
                  transformOrigin: '50% 50%'
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
        
        {/* Center dot */}
        <div className="absolute w-4 h-4 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"></div>
      </div>
      
      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}