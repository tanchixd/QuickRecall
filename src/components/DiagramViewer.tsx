import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { RevisionDiagram, DiagramPin } from '../types';

interface DiagramViewerProps {
  diagram: RevisionDiagram;
  targetMarker?: string;
  isAnswerRevealed?: boolean;
  compact?: boolean;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({
  diagram,
  targetMarker,
  isAnswerRevealed = false,
  compact = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<DiagramPin | null>(null);
  const [peekMarkers, setPeekMarkers] = useState<Record<string, boolean>>({});

  const togglePeek = (marker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPeekMarkers((prev) => ({ ...prev, [marker]: !prev[marker] }));
  };

  const isTarget = (pin: DiagramPin) =>
    targetMarker && String(pin.marker).toLowerCase() === String(targetMarker).toLowerCase();

  const isRevealedForPin = (pin: DiagramPin) => {
    if (isAnswerRevealed && isTarget(pin)) return true;
    return !!peekMarkers[pin.marker];
  };

  const renderContent = (fullscreenMode = false) => {
    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800 select-none">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 text-blue-400 font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
              <Layers className="w-3 h-3" />
              {diagram.type === 'source_image' ? 'Source Diagram' : 'Generated Schematic'}
            </span>
            <span className="text-slate-200 font-medium truncate text-xs" title={diagram.title}>
              {diagram.title}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {targetMarker && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-md">
                Active: Marker [{targetMarker}]
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen(!fullscreenMode)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={fullscreenMode ? 'Close Fullscreen' : 'Enlarge Diagram'}
            >
              {fullscreenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Visual Stage Container */}
        <div
          className={`relative w-full flex items-center justify-center overflow-hidden bg-slate-950 ${
            fullscreenMode ? 'h-[70vh]' : compact ? 'max-h-[260px]' : 'max-h-[360px]'
          }`}
        >
          {diagram.type === 'source_image' && diagram.sourceImageBase64 ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={diagram.sourceImageBase64}
                alt={diagram.title}
                className="max-h-full max-w-full object-contain rounded-lg shadow-md"
              />
              {/* Overlaid Pin Markers */}
              {diagram.pins.map((pin) => {
                const target = isTarget(pin);
                const revealed = isRevealedForPin(pin);
                const left = pin.x !== undefined ? `${pin.x}%` : '50%';
                const top = pin.y !== undefined ? `${pin.y}%` : '50%';

                return (
                  <div
                    key={pin.id}
                    style={{ left, top }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPin(pin)}
                      className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs shadow-lg transition-transform cursor-pointer ${
                        target
                          ? revealed
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/40 scale-110'
                            : 'bg-blue-600 text-white ring-4 ring-blue-400/50 scale-110'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:scale-105'
                      }`}
                    >
                      {target && !revealed && (
                        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75 pointer-events-none" />
                      )}
                      <span>{pin.marker}</span>
                    </button>

                    {/* Quick Pin Tag Label */}
                    {(revealed || isFullscreen) && (
                      <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 whitespace-nowrap z-30 pointer-events-none">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded shadow-md border ${
                            target
                              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-600/80'
                              : 'bg-slate-900/95 text-slate-200 border-slate-700'
                          }`}
                        >
                          {revealed ? pin.label : `[${pin.marker}] ?`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : diagram.svgData ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              {/* Sanitized / Rendered SVG */}
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:rounded-lg"
                dangerouslySetInnerHTML={{ __html: diagram.svgData }}
              />

              {/* Overlaid Interactive Pin Callouts */}
              {diagram.pins.map((pin) => {
                const target = isTarget(pin);
                const revealed = isRevealedForPin(pin);
                const left = pin.x !== undefined ? `${pin.x}%` : '50%';
                const top = pin.y !== undefined ? `${pin.y}%` : '50%';

                return (
                  <div
                    key={pin.id}
                    style={{ left, top }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPin(pin)}
                      className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs shadow-lg transition-transform cursor-pointer ${
                        target
                          ? revealed
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/40 scale-110'
                            : 'bg-blue-600 text-white ring-4 ring-blue-400/50 scale-110'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:scale-105'
                      }`}
                    >
                      {target && !revealed && (
                        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75 pointer-events-none" />
                      )}
                      <span>{pin.marker}</span>
                    </button>

                    {/* Quick Pin Tag Label */}
                    {(revealed || isFullscreen) && (
                      <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 whitespace-nowrap z-30 pointer-events-none">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded shadow-md border ${
                            target
                              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-600/80'
                              : 'bg-slate-900/95 text-slate-200 border-slate-700'
                          }`}
                        >
                          {revealed ? pin.label : `[${pin.marker}] ?`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Diagram preview unavailable.
            </div>
          )}
        </div>

        {/* Bottom Interactive Legend / Active Target Status */}
        <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {targetMarker ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Label to identify:</span>
                <span className="font-bold text-blue-400">Marker [{targetMarker}]</span>
                {isAnswerRevealed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 ml-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {diagram.pins.find((p) => isTarget(p))?.label || 'Revealed'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => togglePeek(targetMarker, e)}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer ml-1"
                  >
                    {peekMarkers[targetMarker] ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide peek
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Peek label
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Tap any numbered pin to inspect or reveal.
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">
              {diagram.pins.length} marker{diagram.pins.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Selected Pin Tooltip Modal */}
        <AnimatePresence>
          {selectedPin && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-10 left-3 right-3 sm:left-auto sm:right-3 sm:w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    {selectedPin.marker}
                  </span>
                  <span>Marker [{selectedPin.marker}]</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs">
                {isRevealedForPin(selectedPin) ? (
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-300">{selectedPin.label}</p>
                    {selectedPin.description && (
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {selectedPin.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-slate-400 italic">
                      [Label hidden for active recall test]
                    </p>
                    <button
                      type="button"
                      onClick={(e) => togglePeek(selectedPin.marker, e)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Reveal this label</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {renderContent(false)}

      {/* Fullscreen Modal View */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <div className="w-full max-w-4xl max-h-full">
              {renderContent(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
