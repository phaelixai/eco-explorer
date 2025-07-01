import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';

// ===================== DATA STRUCTURES & GAME CONSTANTS =====================
const MAX_RESEARCH_LEVEL = 2;
const XP_PER_LEVEL = 100;
const XP_PER_ENCOUNTER = 25;
const SCAN_DURATION = 3000;
const FOCUS_TIMEOUT = 7000;
const BASE_ENCOUNTER_CHANCE = 0.80;
const BASE_RADIANT_CHANCE = 0.05;
const RARITY_WEIGHTS = { common: 10, uncommon: 5, rare: 1 };
const HOTSPOT_RADIUS = 75;
const IMAGE_ASSETS = {
    day: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop',
    night: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=2670&auto=format&fit=crop',
};
const speciesData = [
    { id: 'forest_squirrel', name: 'Forest Squirrel', emoji: '🐿️', rarity: 'common', habitat: 'ground', quizPool: [
        { question: 'What is a squirrel\'s favorite activity?', correctAnswer: 'Burying nuts', wrongAnswers: ['Swimming', 'Flying south', 'Singing opera'] },
        { question: 'What is a group of squirrels called?', correctAnswer: 'A scurry', wrongAnswers: ['A flock', 'A herd', 'A school'] },
        { question: 'How do squirrels primarily find their buried nuts?', correctAnswer: 'A powerful sense of smell', wrongAnswers: ['A photographic memory', 'GPS trackers', 'Asking other squirrels'] },
        { question: 'A squirrel\'s front teeth...', correctAnswer: 'Never stop growing', wrongAnswers: ['Fall out every year', 'Are replaced twice', 'Are made of wood'] },
        { question: 'To fool other animals, squirrels will sometimes pretend to...', correctAnswer: 'Bury a nut', wrongAnswers: ['Be a statue', 'Conduct an orchestra', 'Read a tiny newspaper'] },
        { question: 'What is a primary predator of the Forest Squirrel?', correctAnswer: 'Hawks and owls', wrongAnswers: ['Deer', 'Fish', 'Insects'] },
        { question: 'How do squirrels communicate with each other?', correctAnswer: 'Through complex tail flicks and chatters', wrongAnswers: ['By writing letters', 'Using telepathy', 'Sending smoke signals'] },
        { question: 'What is the average lifespan of a wild Forest Squirrel?', correctAnswer: 'About 2-3 years', wrongAnswers: ['About 10-12 years', 'About 6 months', 'Over 20 years'] }
    ], encounterRules: { time: ['day'], weather: ['clear'] }, masteryPerk: { id: 'keen-eye', name: 'Keen Eye', description: 'Slightly increases the chance of finding Radiant Variants.' } },
    { id: 'night_owl', name: 'Night Owl', emoji: '🦉', rarity: 'uncommon', habitat: 'sky', quizPool: [
        { question: 'What makes an owl a silent hunter?', correctAnswer: 'Specialized feather structure', wrongAnswers: ['It holds its breath', 'It wears tiny slippers', 'It only hunts in vacuums'] },
        { question: 'What is an owl\'s head rotation capability?', correctAnswer: 'Up to 270 degrees', wrongAnswers: ['A full 360 degrees', 'Only 90 degrees', 'It cannot rotate its head'] },
        { question: 'A group of owls is called a...', correctAnswer: 'Parliament', wrongAnswers: ['Congress', 'Senate', 'Court'] },
        { question: 'Owls cannot move their eyeballs. Why?', correctAnswer: 'They are fixed in their sockets', wrongAnswers: ['They are too lazy', 'They are square-shaped', 'They prefer not to'] },
        { question: 'What is the term for an owl\'s pellet?', correctAnswer: 'A casting', wrongAnswers: ['A nugget', 'A hootenanny', 'A gobstopper'] },
        { question: 'What is an owl\'s primary diet?', correctAnswer: 'Small mammals, insects, and other birds', wrongAnswers: ['Fruits and berries', 'Seeds and nuts', 'Only fish'] },
        { question: 'An owl\'s eyes are not true "eyeballs." What are they?', correctAnswer: 'Eye tubes', wrongAnswers: ['Eye squares', 'Eye cones', 'Eye discs'] },
        { question: 'Why are owls often associated with wisdom in mythology?', correctAnswer: 'Their nocturnal habits and watchful gaze', wrongAnswers: ['They can read ancient texts', 'They attended owl university', 'They wear tiny spectacles'] }
    ], encounterRules: { time: ['night'], weather: ['clear'] }, masteryPerk: { id: 'night-vision', name: 'Night Vision', description: 'Allows you to find some daytime creatures at night.' } },
    { id: 'rain_frog', name: 'Rain Frog', emoji: '🐸', rarity: 'uncommon', habitat: 'ground', quizPool: [
        { question: 'Where do many frog species lay their eggs?', correctAnswer: 'In water', wrongAnswers: ['In trees', 'In deserts', 'In nests made of twigs'] },
        { question: 'How do frogs drink water?', correctAnswer: 'They absorb it through their skin', wrongAnswers: ['They use a long tongue', 'They only drink morning dew', 'They don\'t need water'] },
        { question: 'What is the study of amphibians and reptiles called?', correctAnswer: 'Herpetology', wrongAnswers: ['Ornithology', 'Ichthyology', 'Frogology'] },
        { question: 'A frog\'s call is unique to its...', correctAnswer: 'Species', wrongAnswers: ['Mood', 'Favorite color', 'Astrological sign'] },
        { question: 'What is a "tadpole"?', correctAnswer: 'A larval frog', wrongAnswers: ['A type of fish', 'A very small toad', 'A frog\'s nickname'] },
        { question: 'A frog\'s slimy skin is crucial for what function?', correctAnswer: 'Respiration (breathing)', wrongAnswers: ['Hearing', 'Seeing in the dark', 'Digesting food'] },
        { question: 'What does the term "cold-blooded" mean for a frog?', correctAnswer: 'Its body temperature matches its environment', wrongAnswers: ['It has ice in its veins', 'It prefers winter', 'It is unfriendly'] },
        { question: 'Some frog species can survive being frozen solid. How?', correctAnswer: 'High glucose in their organs acts as antifreeze', wrongAnswers: ['They wrap in a thick blanket of leaves', 'They shiver very, very fast', 'They have a tiny internal furnace'] }
    ], encounterRules: { time: ['day', 'night'], weather: ['rainy'] }, masteryPerk: { id: 'rain-resistance', name: 'Rain Resistance', description: 'Allows you to find some clear-weather creatures in the rain.' } },
    { id: 'firefly', name: 'Firefly', emoji: '✨', rarity: 'rare', habitat: 'sky', quizPool: [
        { question: 'How do fireflies produce light?', correctAnswer: 'Bioluminescence', wrongAnswers: ['They swallow tiny light bulbs', 'Static electricity', 'Reflecting moonlight'] },
        { question: 'What is the main purpose of a firefly\'s light?', correctAnswer: 'To attract mates', wrongAnswers: ['To see in the dark', 'To scare predators', 'To charge their phones'] },
        { question: 'Are fireflies a type of fly?', correctAnswer: 'No, they are beetles', wrongAnswers: ['Yes, a type of housefly', 'They are related to moths', 'They are a type of mosquito'] },
        { question: 'The light produced by a firefly is called...', correctAnswer: 'Cold light', wrongAnswers: ['Hot light', 'Sparkle light', 'Flashy light'] },
        { question: 'What do firefly larvae often eat?', correctAnswer: 'Snails and slugs', wrongAnswers: ['Leaves and nectar', 'Tiny rocks', 'Moonbeams'] },
        { question: 'What time of year are fireflies most commonly seen?', correctAnswer: 'Early summer', wrongAnswers: ['Deep winter', 'The first day of spring', 'Only on Halloween'] },
        { question: 'Do all fireflies glow?', correctAnswer: 'No, some species do not light up', wrongAnswers: ['Yes, every single one', 'Only the males', 'Only the females'] },
        { question: 'A firefly\'s light is extremely efficient, losing very little energy as...', correctAnswer: 'Heat', wrongAnswers: ['Sound', 'Electricity', 'Mass'] }
    ], encounterRules: { time: ['night'], weather: ['clear'] }, masteryPerk: { id: 'biolight-attractor', name: 'Biolight Attractor', description: 'Slightly increases the encounter rate at night.' } },
];

// ===================== COMPONENTS =====================
const selectByRarity = (speciesPool) => {
    if (speciesPool.length === 0) return null;
    const totalWeight = speciesPool.reduce((sum, s) => sum + (RARITY_WEIGHTS[s.rarity] || 1), 0);
    let random = Math.random() * totalWeight;
    for (const s of speciesPool) {
        const weight = RARITY_WEIGHTS[s.rarity] || 1;
        if (random < weight) return s;
        random -= weight;
    }
    return speciesPool[speciesPool.length - 1];
};
const EcoLogComponent = ({ ecoLog, onBack }) => ( <div className="screen-container"> <h1>Eco-Log</h1> <p style={{ textAlign: 'center', color: 'var(--light-text)', maxWidth: '600px', marginBottom: '2rem' }}>This catalog tracks all the species you have discovered. Max out their research to unlock perks.</p> <div className="screen-grid"> {speciesData.map(species => { const entry = ecoLog[species.id]; const isDiscovered = !!entry; return ( <div key={species.id} className={`card ${isDiscovered ? 'discovered' : 'undiscovered'}`}> <div className="emoji">{isDiscovered ? species.emoji : '❓'}</div> <h3>{isDiscovered ? species.name : 'Undiscovered'}</h3> {isDiscovered ? ( <> <p>Level: {entry.researchLevel} / {MAX_RESEARCH_LEVEL}</p> <p>Rarity: {species.rarity}</p> <div className="xp-bar-container" title={`XP: ${entry.researchXp} / ${XP_PER_LEVEL}`}> <div className="xp-bar-fill" style={{ width: `${(entry.researchXp / XP_PER_LEVEL) * 100}%` }}></div> </div> </> ) : ( <p>Keep exploring to find this species.</p> )} </div> ); })} </div> <button className="secondary-button" onClick={onBack} style={{ marginTop: '2rem' }}>Back</button> </div> );
const PerksScreen = ({ unlockedPerks, onBack }) => ( <div className="screen-container"> <h1>Mastery Perks</h1> <p style={{ textAlign: 'center', color: 'var(--light-text)', maxWidth: '600px', marginBottom: '2rem' }}>These passive skills are earned by mastering a species' research. They provide permanent advantages.</p> <div className="screen-grid"> {speciesData.map(species => { const perk = species.masteryPerk; const isUnlocked = unlockedPerks.includes(perk.id); return ( <div key={perk.id} className={`card ${isUnlocked ? 'unlocked' : 'locked'}`}> <div className="emoji">{isUnlocked ? species.emoji : '🔒'}</div> <h3>{perk.name}</h3> <p className="description">{perk.description}</p> {!isUnlocked && <p>Master the {species.name} to unlock.</p>} </div> ); })} </div> <button className="secondary-button" onClick={onBack} style={{ marginTop: '2rem' }}>Back</button> </div> );
const ResultModal = ({ message, onClose }) => ( <div className="modal-overlay" onClick={onClose}> <div className="modal-content" onClick={(e) => e.stopPropagation()}> <h2>{message}</h2> <button className="explore-button" onClick={onClose} style={{marginTop: '1rem'}}>OK</button> </div> </div> );
const EncounterModal = ({ encounter, isRadiant, onLog, onRelease }) => ( <div className="modal-overlay"> <div className="modal-content"> <div className="emoji" style={{ filter: isRadiant ? 'drop-shadow(0 0 1rem #fde047)' : 'none' }}>{encounter.emoji}</div> <h2>A {isRadiant && 'Radiant '}{encounter.name} appeared!</h2> <p>What will you do?</p> <div className="button-group"> <button className="explore-button" onClick={onLog}>Log It</button> <button className="danger-button" onClick={onRelease}>Let It Go</button> </div> </div> </div> );
const QuizModal = ({ species, onResult }) => { const quizItem = useMemo(() => species.quizPool[Math.floor(Math.random() * species.quizPool.length)], [species]); const shuffledAnswers = useMemo(() => [quizItem.correctAnswer, ...quizItem.wrongAnswers].sort(() => Math.random() - 0.5), [quizItem]); return ( <div className="modal-overlay"> <div className="modal-content"> <div className="emoji">{species.emoji}</div> <h2>{quizItem.question}</h2> <div className="quiz-options"> {shuffledAnswers.map(answer => ( <button key={answer} className="quiz-option-btn" onClick={() => onResult(answer === quizItem.correctAnswer)}> {answer} </button> ))} </div> </div> </div> ); };
const ARStarfield = ({ numStars, isVisible }) => { const stars = useMemo(() => Array.from({ length: numStars }).map((_, i) => { const size = Math.random() * 2 + 1; const style = { width: `${size}px`, height: `${size}px`, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, }; return <div key={i} className="star" style={style}></div>; }), [numStars]); return <div className="ar-starfield" style={{ opacity: isVisible ? 1 : 0 }}>{stars}</div>; };
const Constellation = ({ constellation }) => { if (!constellation) return null; return ( <div className="constellation" style={{ top: `${constellation.y}px`, left: `${constellation.x}px` }}> <div className="constellation-emoji">{constellation.species.emoji}</div> </div> ); };
const HotspotVisualizer = ({ hotspot }) => { if (!hotspot) return null; const style = { top: `${hotspot.y - HOTSPOT_RADIUS}px`, left: `${hotspot.x - HOTSPOT_RADIUS}px`, width: `${HOTSPOT_RADIUS * 2}px`, height: `${HOTSPOT_RADIUS * 2}px`, }; return <div className="hotspot-visualizer" style={style}></div>; };
const WeatherOverlay = ({ weather }) => { if (weather !== 'rainy') return null; return <div className="visual-overlay rain-effect visible"></div>; };
const LightingOverlay = ({ time }) => { return <div className={`visual-overlay ${time === 'day' ? 'god-rays' : 'moon-glow'} visible`}></div>; };

// ===================== MAIN APP =====================
export default function App() {
    const [currentScreen, setCurrentScreen] = useState('explore');
    const [playerState, setPlayerState] = useState({ gameTime: 'day', weather: 'clear', unlockedPerks: [] });
    const [ecoLog, setEcoLog] = useState({});
    const [modalState, setModalState] = useState({ encounter: false, quiz: false, result: false });
    const [activeEncounter, setActiveEncounter] = useState(null);
    const [isRadiantEncounter, setIsRadiantEncounter] = useState(false);
    const [lastEncounterMessage, setLastEncounterMessage] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isFocusing, setIsFocusing] = useState(false);
    const [hotspot, setHotspot] = useState(null);
    const [constellation, setConstellation] = useState(null);
    const [resultMessage, setResultMessage] = useState("");
    const scannerWindowRef = useRef(null);

    useEffect(() => {
        const gameLoop = setInterval(() => {
            setPlayerState(p => ({ ...p, gameTime: p.gameTime === 'day' ? 'night' : 'day', weather: Math.random() > 0.7 ? 'rainy' : 'clear' }));
        }, 30000);
        return () => clearInterval(gameLoop);
    }, []);

    const grantXp = useCallback((speciesId, amount) => {
        setEcoLog(prevLog => {
            const species = speciesData.find(s => s.id === speciesId);
            if (!species) return prevLog;
            const currentEntry = prevLog[speciesId] || { researchLevel: 0, researchXp: 0 };
            if (currentEntry.researchLevel >= MAX_RESEARCH_LEVEL) return prevLog;
            let newLevel = currentEntry.researchLevel === 0 ? 1 : currentEntry.researchLevel;
            let newXp = currentEntry.researchXp + amount;
            while (newXp >= XP_PER_LEVEL && newLevel < MAX_RESEARCH_LEVEL) { newXp -= XP_PER_LEVEL; newLevel++; }
            if (newLevel >= MAX_RESEARCH_LEVEL) {
                newXp = XP_PER_LEVEL;
                const perkId = species.masteryPerk.id;
                if (!playerState.unlockedPerks.includes(perkId)) {
                    setTimeout(() => {
                        setResultMessage(`Mastery! You learned '${species.masteryPerk.name}'.`);
                        setModalState(s => ({ ...s, result: true }));
                        setPlayerState(p => ({...p, unlockedPerks: [...p.unlockedPerks, perkId]}));
                    }, 500);
                }
            }
            return { ...prevLog, [speciesId]: { researchLevel: newLevel, researchXp: newXp } };
        });
    }, [playerState.unlockedPerks]);

    const closeAllModals = () => {
        setModalState({ encounter: false, quiz: false, result: false });
        setActiveEncounter(null);
        setIsRadiantEncounter(false);
        setConstellation(null);
    };

    const handleAnalyzeBiome = useCallback(() => {
        if (isScanning || isFocusing || !scannerWindowRef.current) return;
        setIsScanning(true);
        setLastEncounterMessage(null);
        setConstellation(null);
        setTimeout(() => {
            setIsScanning(false);
            const { unlockedPerks, gameTime, weather } = playerState;
            const hasBiolightAttractor = unlockedPerks.includes('biolight-attractor');
            let encounterChance = BASE_ENCOUNTER_CHANCE;
            if (gameTime === 'night' && hasBiolightAttractor) encounterChance += 0.1;
            if (Math.random() > encounterChance) {
                setHotspot(null);
                setIsFocusing(true);
                return;
            }
            const hasNightVision = unlockedPerks.includes('night-vision');
            const hasRainResistance = unlockedPerks.includes('rain-resistance');
            const speciesPool = speciesData.filter(s => {
                const timeMatch = s.encounterRules.time.includes(gameTime);
                const weatherMatch = s.encounterRules.weather.includes(weather);
                const nightVisionBonus = hasNightVision && gameTime === 'night' && s.encounterRules.time.includes('day');
                const rainResistBonus = hasRainResistance && weather === 'rainy' && s.encounterRules.weather.includes('clear');
                return timeMatch || weatherMatch || nightVisionBonus || rainResistBonus;
            });
            if (speciesPool.length === 0) { setHotspot(null); setIsFocusing(true); return; }
            const encounteredSpecies = selectByRarity(speciesPool);
            if (!encounteredSpecies) { setHotspot(null); setIsFocusing(true); return; }
            const rect = scannerWindowRef.current?.getBoundingClientRect();
            if (rect) {
                const habitat = encounteredSpecies.habitat;
                let y;
                if (habitat === 'sky') {
                    y = Math.random() * (rect.height * 0.6);
                } else {
                    y = (rect.height * 0.6) + (Math.random() * (rect.height * 0.4));
                }
                setHotspot({
                    x: Math.random() * (rect.width - (HOTSPOT_RADIUS * 2)) + HOTSPOT_RADIUS,
                    y: y,
                    species: encounteredSpecies,
                });
            }
            setIsFocusing(true);
        }, SCAN_DURATION);
    }, [isScanning, isFocusing, playerState]);

    useEffect(() => {
        if (!isFocusing) return;
        const handleMouseMove = (e) => {
            if (!hotspot || !scannerWindowRef.current) return;
            const rect = scannerWindowRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const distance = Math.sqrt(Math.pow(mouseX - hotspot.x, 2) + Math.pow(mouseY - hotspot.y, 2));
            if (distance < HOTSPOT_RADIUS) {
                setConstellation({ x: hotspot.x, y: hotspot.y, species: hotspot.species });
                setActiveEncounter(hotspot.species);
                const hasKeenEye = playerState.unlockedPerks.includes('keen-eye');
                const radiantChance = hasKeenEye ? BASE_RADIANT_CHANCE * 1.5 : BASE_RADIANT_CHANCE;
                setIsRadiantEncounter(Math.random() < radiantChance);
                setIsFocusing(false);
                setHotspot(null);
                setTimeout(() => {
                    setModalState(s => ({...s, quiz: true}));
                }, 1200);
            }
        };
        const focusTimeout = setTimeout(() => {
            if (isFocusing) {
                setIsFocusing(false);
                setHotspot(null);
                setLastEncounterMessage("No dominant bio-signatures found.");
            }
        }, FOCUS_TIMEOUT);
        const currentScannerWindow = scannerWindowRef.current;
        currentScannerWindow?.addEventListener('mousemove', handleMouseMove);
        return () => {
            currentScannerWindow?.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(focusTimeout);
        };
    }, [isFocusing, hotspot, playerState.unlockedPerks]);

    const handleGameResult = (wasSuccessful) => { setResultMessage(""); if (wasSuccessful) { const xpGain = isRadiantEncounter ? XP_PER_ENCOUNTER * 5 : XP_PER_ENCOUNTER; grantXp(activeEncounter.id, xpGain); if (!resultMessage.includes("Mastery!")) { setResultMessage(`Success! ${activeEncounter.name} has been logged.`); setModalState({ encounter: false, quiz: false, result: true }); } } else { setResultMessage(`Oh no! The ${activeEncounter.name} fled...`); setModalState({ encounter: false, quiz: false, result: true }); } };

    return (
        <>
            <div className="app-container">
                <div className={`bio-scanner-window ${isFocusing ? 'focus-active' : ''}`} ref={scannerWindowRef}>
                    <div className={`image-layer ${playerState.gameTime === 'day' ? 'animated-background' : ''}`} style={{ backgroundImage: `url(${IMAGE_ASSETS.day})`, opacity: playerState.gameTime === 'day' ? 1 : 0 }}></div>
                    <div className={`image-layer ${playerState.gameTime === 'night' ? 'animated-background' : ''}`} style={{ backgroundImage: `url(${IMAGE_ASSETS.night})`, opacity: playerState.gameTime === 'night' ? 1 : 0 }}></div>
                    <WeatherOverlay weather={playerState.weather} />
                    <LightingOverlay time={playerState.gameTime} />
                    <div className="bio-scanner-overlay"></div>
                    <ARStarfield numStars={150} isVisible={isFocusing || !!constellation} />
                    <Constellation constellation={constellation} />
                    <HotspotVisualizer hotspot={hotspot} />
                    {isScanning && (
                        <div className="exploration-animation visible">
                            <div className="radar">
                                <div className="radar-grid"></div>
                                <div className="radar-sweep"></div>
                            </div>
                            <p className="exploration-text">Scanning Biome...</p>
                        </div>
                    )}
                    <div className="game-status">
                        <p>Time: {playerState.gameTime.charAt(0).toUpperCase() + playerState.gameTime.slice(1)}</p>
                        <p>Weather: {playerState.weather.charAt(0).toUpperCase() + playerState.weather.slice(1)}</p>
                    </div>
                </div>
                <div className="control-panel">
                    {currentScreen === 'explore' ? (
                        <>
                            <div className="button-group">
                                <button className="explore-button" onClick={handleAnalyzeBiome} disabled={isScanning || isFocusing}>
                                    {isScanning ? 'Scanning...' : isFocusing ? 'Focusing...' : 'Analyze Biome'}
                                </button>
                            </div>
                            <div className="button-group">
                                <button className="secondary-button" onClick={() => setCurrentScreen('ecoLog')}>View Eco-Log</button>
                                <button className="secondary-button" onClick={() => setCurrentScreen('perks')}>View Perks</button>
                            </div>
                            {lastEncounterMessage && <p style={{ color: 'var(--light-text)', marginTop: '1rem' }}>{lastEncounterMessage}</p>}
                        </>
                    ) : ( <div/> )}
                </div>
                {currentScreen === 'ecoLog' && <EcoLogComponent ecoLog={ecoLog} onBack={() => setCurrentScreen('explore')} />}
                {currentScreen === 'perks' && <PerksScreen unlockedPerks={playerState.unlockedPerks} onBack={() => setCurrentScreen('explore')} />}
                {activeEncounter && modalState.quiz && ( <QuizModal species={activeEncounter} onResult={handleGameResult} /> )}
                {modalState.result && ( <ResultModal message={resultMessage} onClose={closeAllModals} /> )}
            </div>
        </>
    );
}
