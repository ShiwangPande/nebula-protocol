
import React, { useState } from 'react';
import { ModPackage, RoleDefinition, TaskDefinition } from '../../types';
import { generateModPackage } from '../../services/gemini';
import { Loader2, Zap, Download } from 'lucide-react';

export const ModPanel: React.FC<{ registry: any, onClose: () => void, onLoadMod: (m: ModPackage) => void }> = ({ registry, onClose, onLoadMod }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGen = async () => {
        setLoading(true);
        const mod = await generateModPackage(prompt);
        if (mod) onLoadMod(mod);
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-space-800 p-6 rounded-lg border border-neon-cyan w-full max-w-lg">
                <h2 className="text-neon-cyan font-bold text-xl mb-4 flex items-center gap-2"><Zap/> AI MOD GENERATOR</h2>
                <textarea className="w-full bg-black/50 text-white p-4 rounded h-32 border border-gray-700 mb-4" placeholder="Describe new roles or tasks..." value={prompt} onChange={e => setPrompt(e.target.value)} />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="text-gray-400">Close</button>
                    <button onClick={handleGen} disabled={loading} className="bg-neon-cyan text-black px-4 py-2 rounded font-bold flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <Download size={16}/>} Generate
                    </button>
                </div>
            </div>
        </div>
    );
};
