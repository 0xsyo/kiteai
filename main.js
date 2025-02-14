import axios from 'axios';
import fs from 'fs';
import chalk from 'chalk';
import { faker } from '@faker-js/faker';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

const agents = {
  "deployment_hp4y88pxnqxwlmpxllicjzzn": "Professor",
  "deployment_nc3y3k7zy6gekszmcsordhu7": "Crypto Buddy",
  "deployment_sofftlsf9z4fya3qchykaanq": "Sherlock"
};

const apiKey = 'your_groq_apikeys';
const headersFilePath = 'headers.json';
const proxyIndexFilePath = 'proxy_index.txt';
let rateLimitExceeded = false;

const ASCII_ART = `
  _______                          
 |     __|.--.--.---.-.-----.---.-.
 |__     ||  |  |  _  |-- __|  _  |
 |_______||___  |___._|_____|___._|
          |_____|
`;

function rainbowBanner() {
  const colors = [chalk.red, chalk.yellow, chalk.green, chalk.cyan, chalk.blue, chalk.magenta];
  console.clear();
  for (let i = 0; i < ASCII_ART.length; i++) {
    process.stdout.write(colors[i % colors.length](ASCII_ART[i]));
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }
  console.log(chalk.yellow("\n"));
}

function loadHeaders() {
  if (fs.existsSync(headersFilePath)) {
    const headersData = fs.readFileSync(headersFilePath, 'utf-8');
    return JSON.parse(headersData);
  }
  return {};
}

function saveHeaders(headers) {
  fs.writeFileSync(headersFilePath, JSON.stringify(headers, null, 2));
}

function generateRandomDesktopHeader() {
  return faker.internet.userAgent({ deviceCategory: 'desktop' });
}

function getRandomTheme() {
  const themes = [
    "Proof of Attributed Intelligence (PoAI)",
    "Decentralized AI Governance",
    "Democratization of AI Economy",
    "AI-powered Smart Contracts",
    "Blockchain-based AI Marketplaces",
    "Autonomous AI Agents on Blockchain",
    "Scalability Challenges in AI & Blockchain",
    "Zero-Knowledge Proofs for AI Privacy",
    "AI and Blockchain Synergy for Cybersecurity",
    "Energy Efficiency in AI Blockchain Networks"
  ];
  return themes[Math.floor(Math.random() * themes.length)];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateRandomWords() {
  const words = {
    subjects: [
      "AI", "blockchain", "smart contracts", "scalability", "security", "privacy", "decentralization", "automation", "trust", "efficiency"
    ],
    verbs: [
      "improve", "affect", "contribute", "enhance", "drive", "change", "transform", "reduce", "optimize", "strengthen"
    ],
    objects: [
      "technology", "systems", "applications", "networks", "protocols", "platforms", "transactions", "processes", "infrastructure", "economy"
    ],
    questions: [
      "How", "What", "Can", "Why", "Does", "What is the impact of", "How does", "What effect does", "Can", "How can"
    ],
    modifiers: [
      "the future of", "the efficiency of", "the security of", "the scalability of", "the integration of", "the development of", "the adoption of"
    ]
  };

  const subject = words.subjects[Math.floor(Math.random() * words.subjects.length)];
  const verb = words.verbs[Math.floor(Math.random() * words.verbs.length)];
  const object = words.objects[Math.floor(Math.random() * words.objects.length)];
  const question = words.questions[Math.floor(Math.random() * words.questions.length)];
  const modifier = words.modifiers[Math.floor(Math.random() * words.modifiers.length)];

  return {
    subject,
    verb,
    object,
    question,
    modifier
  };
}

function generateHardcodedQuestion(theme) {
  const { subject, verb, object, question, modifier } = generateRandomWords();

  // Construct a random yet structured question
  const questionString = `${question} ${subject} ${verb} ${modifier} ${object}?`;
  return questionString;
}

async function generateRandomQuestion() {
  const theme = getRandomTheme();
  
  // Jika rate limit terlewati, fallback ke pertanyaan hardcoded
  if (rateLimitExceeded) {
    return generateHardcodedQuestion(theme);
  }
  
  try {
    // Perbarui prompt untuk mendapatkan variasi pertanyaan yang lebih banyak dan lebih singkat
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'user', 
          content: `Generate a short, diverse, and random question related to '${theme}' in the context of AI and blockchain. Avoid repetitive phrasing such as 'What impact'. Use different structures like 'What is', 'Can', 'How does', 'Why does', 'Does', and others. Keep it concise and avoid long sentences.`
        }
      ],
      temperature: 0.9
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // Set timeout to 20 seconds
    });
    
    // Kembalikan pertanyaan yang dihasilkan
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    // Menangani error jika terjadi rate limit atau lainnya
    if (error.response && error.response.data && error.response.data.code === 'rate_limit_exceeded') {
      rateLimitExceeded = true;
      console.error(chalk.red('Rate limit exceeded. Switching to hardcoded questions.'));
      return generateHardcodedQuestion(theme);
    } else {
      console.error(chalk.red('Error generating question:'), error.response ? error.response.data : error.message);
      return generateHardcodedQuestion(theme);
    }
  }
}

function getCurrentTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
}

function loadProxies() {
  if (fs.existsSync('proxy.txt')) {
    const proxyData = fs.readFileSync('proxy.txt', 'utf-8');
    return proxyData.split('\n').filter(Boolean);
  }
  return [];
}

function saveProxyIndex(index) {
  fs.writeFileSync(proxyIndexFilePath, index.toString());
}

function loadProxyIndex() {
  if (fs.existsSync(proxyIndexFilePath)) {
    const indexData = fs.readFileSync(proxyIndexFilePath, 'utf-8');
    return parseInt(indexData, 10);
  }
  return 0;
}

function createProxyAgent(proxy) {
  const [protocol, host, port] = proxy.split(/:\/\/|:/);
  switch (protocol) {
    case 'http':
      return new HttpProxyAgent(`http://${host}:${port}`);
    case 'socks4':
      return new SocksProxyAgent(`socks4://${host}:${port}`);
    case 'socks5':
      return new SocksProxyAgent(`socks5://${host}:${port}`);
    default:
      throw new Error(`Unsupported proxy protocol: ${protocol}`);
  }
}

async function sendRandomQuestion(agent, headers, proxy, retries = 3) {
  const randomQuestion = await generateRandomQuestion();
  if (rateLimitExceeded) {
    return { question: randomQuestion, response: { content: '' } };
  }

  const proxyTimeout = 60000; // Timeout dalam milidetik untuk proxy
  const config = {
    headers: { 
      'Content-Type': 'application/json',
      ...headers,
      'access-control-allow-origin': '*',
      'cache-control': 'no-cache',
      'connection': 'keep-alive'
    },
    timeout: proxyTimeout // Set timeout untuk request
  };

  if (proxy) {
    config['httpAgent'] = createProxyAgent(proxy);
    config['httpsAgent'] = createProxyAgent(proxy);
    console.log(chalk.cyan(`Using proxy: ${proxy}`));
  } else {
    config['httpAgent'] = null;
    config['httpsAgent'] = null;
    console.log(chalk.cyan('Using direct connection'));
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const payload = { message: randomQuestion, stream: false };
      const response = await axios.post(`https://${agent.toLowerCase().replace('_','-')}.stag-vxzy.zettablock.com/main`, payload, config);
      return { question: randomQuestion, response: response.data.choices[0].message };
    } catch (error) {
      console.error(chalk.red(`Error sending question (attempt ${attempt}):`), error.response ? error.response.data : error.message);
      if (attempt === retries) {
        return { question: randomQuestion, response: { content: '' } };
      }
      await sleep(2000); // Wait for 2 seconds before retrying
    }
  }
}

async function reportUsage(wallet, options) {
  try {
    const payload = {
      wallet_address: wallet,
      agent_id: options.agent_id,
      request_text: options.question,
      response_text: options.response,
      request_metadata: {}
    };

    const response = await axios.post(
      `https://quests-usage-dev.prod.zettablock.com/api/report_usage`, 
      payload, 
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(chalk.green('Usage data reported successfully!'));
    console.log(chalk.green(`Interaction ID: ${response.data.interaction_id}`));
    console.log(chalk.green(`Hashed Input Data: ${response.data.hashed_input_data}`));
    console.log(chalk.green(`Hashed Output Data: ${response.data.hashed_output_data}`));
    console.log(chalk.green(`Message: ${response.data.message}`));
  } catch (error) {
    if (error.response) {
      console.error(chalk.red('Failed to report usage:'), error.response.data);
    } else {
      console.error(chalk.red('Failed to report usage:'), error.message);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function countdown(randomTime) {
  for (let i = randomTime; i > 0; i--) {
    const hours = Math.floor(i / 3600);
    const minutes = Math.floor((i % 3600) / 60);
    const seconds = i % 60;
    process.stdout.write(`Waiting time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}\r`);
    await sleep(1000);
  }
  console.log();
}

async function processWallet(wallet, headers, iterationsPerAgent, proxies, usedProxies) {
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.greenBright(`${getCurrentTime()} - Wallet: ${wallet}`));
  let proxyIndex = loadProxyIndex();
  let currentProxy = null;

  // Find a unique proxy for the wallet
  while (!currentProxy && proxyIndex < proxies.length) {
    const potentialProxy = proxies[proxyIndex % proxies.length];
    if (!usedProxies.has(potentialProxy)) {
      currentProxy = potentialProxy;
      usedProxies.add(currentProxy);
    }
    proxyIndex++;
  }

  // If no proxy is available, use direct connection
  if (!currentProxy && proxies.length === 0) {
    console.log(chalk.yellow('No proxies available. Using direct connection.'));
  } else if (!currentProxy) {
    console.error(chalk.red('No available proxies left to use.'));
    return;
  }

  saveProxyIndex(proxyIndex);

  for (const [agentId, agentName] of Object.entries(agents)) {
    console.log(chalk.greenBright(`${getCurrentTime()} - Agent: ${agentName}`));
    console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    for (let i = 0; i < iterationsPerAgent; i++) {
      console.log(chalk.yellow(`${getCurrentTime()} - Iteration-${i + 1}`));
      
      let nanya = null;
      let attempt = 0;

      while (!nanya && attempt < (currentProxy ? proxies.length : 1)) {
        nanya = await sendRandomQuestion(agentId, headers[wallet], currentProxy);
        if (!nanya || !nanya.response || !nanya.response.content) {
          if (currentProxy) {
            console.log(chalk.red('Unable to send question, switching proxy...'));
            usedProxies.delete(currentProxy); // Remove the failed proxy from usedProxies
            currentProxy = null;

            // Find a new unique proxy for the wallet
            while (!currentProxy && proxyIndex < proxies.length) {
              const potentialProxy = proxies[proxyIndex % proxies.length];
              if (!usedProxies.has(potentialProxy)) {
                currentProxy = potentialProxy;
                usedProxies.add(currentProxy);
              }
              proxyIndex++;
            }

            if (!currentProxy) {
              console.log(chalk.yellow('No proxies available. Using direct connection.'));
              break;
            }
            attempt++;
            await sleep(1000); // Tunggu sebelum mencoba lagi
          } else {
            break; // No proxy, use direct connection
          }
        }
      }

      if (nanya && nanya.response && nanya.response.content) {
        const truncatedResponse = nanya.response.content.split(' ').slice(0, 7).join(' ') + '...';
        console.log(chalk.cyan('Question:'), chalk.bold(nanya.question));
        console.log(chalk.green('Answer:'), chalk.italic(truncatedResponse));

        await reportUsage(wallet.toLowerCase(), {
          agent_id: agentId,
          question: nanya.question,
          response: nanya.response.content
        });

        await sleep(1000);
      } else {
        console.log(chalk.red('Max retries reached. Unable to send question.'));
      }
    }

    console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  }
}

async function main() {
  console.clear(); // Tambahkan ini untuk membersihkan log konsol setiap kali kode dijalankan
  rainbowBanner();

  const wallets = fs.readFileSync('wallet.txt', 'utf-8').split('\n').filter(Boolean);
  const proxies = loadProxies();
  const headers = loadHeaders();
  const iterationsPerAgent = 10; // Update to only one iteration per agent
  let usedProxies = new Set();

  for (const wallet of wallets) {
    if (!headers[wallet]) {
      headers[wallet] = { 'User-Agent': generateRandomDesktopHeader() };
      saveHeaders(headers);
    }

    try {
      await processWallet(wallet, headers, iterationsPerAgent, proxies, usedProxies);
    } catch (error) {
      console.error(chalk.red(`Failed to process wallet ${wallet}:`), error);
    }
  }

  const randomTime = Math.floor(Math.random() * (7 * 3600 - 3 * 3600 + 1)) + 3 * 3600;
  await countdown(randomTime);

  // Reset rateLimitExceeded for the next iteration
  rateLimitExceeded = false;
  await main(); // Start the process again
}

main();
