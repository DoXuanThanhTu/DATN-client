interface ImagePreviewProps {
  fileData: {
    url: string | null;
    progress: number;
    name: string;
  };
}

export default function ImagePreview({ fileData }: ImagePreviewProps) {
  const { url, progress, name } = fileData;

  const isFinished = !!url || progress >= 100;

  return (
    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm group">
      {url ? (
        <img
          src={`${url}?tr=w-300,q-70`}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[10px] text-gray-400">
          Processing...
        </div>
      )}

      {!isFinished && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] transition-opacity duration-300">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center relative shadow-sm"
            style={{
              background: `conic-gradient(#3b82f6 ${progress * 3.6}deg, #e2e8f0 0deg)`,
            }}
          >
            <div className="absolute w-[82%] h-[82%] bg-white rounded-full flex items-center justify-center">
              <span className="text-[10px] font-extrabold text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {isFinished && url && (
        <div className="absolute top-1.5 right-1.5 z-20 bg-green-500 text-white rounded-full p-0.5 shadow-md animate-in zoom-in duration-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
