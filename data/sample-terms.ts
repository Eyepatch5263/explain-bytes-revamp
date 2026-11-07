export interface EngineeringTerm {
  id: string;
  term: string;
  slug: string;
  definition: string;
  category:
    | "System Design"
    | "DBMS"
    | "OS"
    | "Networking"
    | "DevOps"
    | "Machine Learning"
    | "Programming"
    | "Web Development"
    | "Data Structures"
    | "Databases";
  tags: string[];
}

/**
 * Sample engineering terms for development and fallback when Elasticsearch is unavailable.
 */
export const sampleTerms: EngineeringTerm[] = [
  // System Design
  {
    id: "latency",
    term: "Latency",
    slug: "latency",
    definition:
      "Time taken for a request to travel from client to server and back. It is typically measured in milliseconds and is a critical metric for real-time applications.",
    category: "System Design",
    tags: ["performance", "networking", "metrics"],
  },
  {
    id: "throughput",
    term: "Throughput",
    slug: "throughput",
    definition:
      "The number of operations or requests a system can handle per unit of time. Higher throughput indicates better system capacity.",
    category: "System Design",
    tags: ["performance", "scalability", "metrics"],
  },
  {
    id: "load-balancer",
    term: "Load Balancer",
    slug: "load-balancer",
    definition:
      "A device or software that distributes network traffic across multiple servers to ensure no single server is overwhelmed, improving reliability and performance.",
    category: "System Design",
    tags: ["scalability", "availability", "infrastructure"],
  },
  {
    id: "caching",
    term: "Caching",
    slug: "caching",
    definition:
      "Storing frequently accessed data in a faster storage layer to reduce latency and database load. Common caching solutions include Redis and Memcached.",
    category: "System Design",
    tags: ["performance", "optimization", "storage"],
  },
  {
    id: "quorum",
    term: "Quorum",
    slug: "quorum",
    definition:
      "The minimum number of nodes that must agree on a value in a distributed system before that value is considered committed. Essential for consensus protocols.",
    category: "System Design",
    tags: ["distributed-systems", "consensus", "reliability"],
  },
  {
    id: "cap-theorem",
    term: "CAP Theorem",
    slug: "cap-theorem",
    definition:
      "States that a distributed system can only guarantee two of three properties: Consistency, Availability, and Partition Tolerance.",
    category: "System Design",
    tags: ["distributed-systems", "theory", "tradeoffs"],
  },

  // DBMS
  {
    id: "indexing",
    term: "Indexing",
    slug: "indexing",
    definition:
      "A database optimization technique that creates a data structure to speed up data retrieval operations at the cost of additional write overhead and storage.",
    category: "DBMS",
    tags: ["optimization", "query-performance", "storage"],
  },
  {
    id: "acid",
    term: "ACID",
    slug: "acid",
    definition:
      "Properties that guarantee reliable database transactions: Atomicity, Consistency, Isolation, and Durability.",
    category: "DBMS",
    tags: ["transactions", "reliability", "fundamentals"],
  },
  {
    id: "normalization",
    term: "Normalization",
    slug: "normalization",
    definition:
      "The process of organizing database tables to reduce redundancy and improve data integrity through a series of normal forms (1NF, 2NF, 3NF, etc.).",
    category: "DBMS",
    tags: ["schema-design", "optimization", "fundamentals"],
  },
  {
    id: "sharding",
    term: "Sharding",
    slug: "sharding",
    definition:
      "Horizontal partitioning of data across multiple database instances, where each shard contains a subset of the total data.",
    category: "DBMS",
    tags: ["scalability", "distributed-systems", "partitioning"],
  },

  // OS
  {
    id: "deadlock",
    term: "Deadlock",
    slug: "deadlock",
    definition:
      "A situation where two or more processes are blocked forever because each is waiting for resources held by the other. The four conditions are: mutual exclusion, hold and wait, no preemption, and circular wait.",
    category: "OS",
    tags: ["concurrency", "processes", "synchronization"],
  },
  {
    id: "process-vs-thread",
    term: "Process vs Thread",
    slug: "process-vs-thread",
    definition:
      "A process is an independent program with its own memory space, while a thread is a lightweight unit of execution within a process that shares memory with other threads.",
    category: "OS",
    tags: ["concurrency", "fundamentals", "memory"],
  },
  {
    id: "virtual-memory",
    term: "Virtual Memory",
    slug: "virtual-memory",
    definition:
      "A memory management technique that provides an abstraction of the physical memory, allowing processes to use more memory than physically available through paging and swapping.",
    category: "OS",
    tags: ["memory", "fundamentals", "paging"],
  },
  {
    id: "context-switching",
    term: "Context Switching",
    slug: "context-switching",
    definition:
      "The process of storing and restoring the state of a CPU so that execution can resume later. Frequent context switches can impact performance.",
    category: "OS",
    tags: ["performance", "scheduling", "processes"],
  },

  // Networking
  {
    id: "tcp-handshake",
    term: "TCP Handshake",
    slug: "tcp-handshake",
    definition:
      "The three-way handshake (SYN, SYN-ACK, ACK) used to establish a TCP connection between client and server, ensuring reliable communication.",
    category: "Networking",
    tags: ["protocols", "tcp", "connections"],
  },
  {
    id: "dns",
    term: "DNS",
    slug: "dns",
    definition:
      "Domain Name System - translates human-readable domain names (like example.com) into IP addresses that computers use to identify each other on the network.",
    category: "Networking",
    tags: ["infrastructure", "protocols", "fundamentals"],
  },
  {
    id: "http-vs-https",
    term: "HTTP vs HTTPS",
    slug: "http-vs-https",
    definition:
      "HTTP is the unsecured protocol for web communication, while HTTPS adds TLS/SSL encryption to protect data in transit from eavesdropping and tampering.",
    category: "Networking",
    tags: ["security", "protocols", "web"],
  },
  {
    id: "websocket",
    term: "WebSocket",
    slug: "websocket",
    definition:
      "A communication protocol providing full-duplex communication channels over a single TCP connection, enabling real-time bidirectional communication between client and server.",
    category: "Networking",
    tags: ["real-time", "protocols", "web"],
  },

  // DevOps
  {
    id: "ci-cd",
    term: "CI/CD",
    slug: "ci-cd",
    definition:
      "Continuous Integration and Continuous Deployment - practices that automate building, testing, and deploying code changes to production environments.",
    category: "DevOps",
    tags: ["automation", "deployment", "best-practices"],
  },
  {
    id: "containerization",
    term: "Containerization",
    slug: "containerization",
    definition:
      "A lightweight virtualization method that packages applications with their dependencies into isolated containers, ensuring consistent behavior across environments. Docker is the most popular tool.",
    category: "DevOps",
    tags: ["docker", "infrastructure", "deployment"],
  },
  {
    id: "kubernetes",
    term: "Kubernetes",
    slug: "kubernetes",
    definition:
      "An open-source container orchestration platform that automates deployment, scaling, and management of containerized applications across clusters.",
    category: "DevOps",
    tags: ["orchestration", "containers", "scalability"],
  },
  {
    id: "api",
    term: "API",
    slug: "api",
    definition:
      "Application Programming Interface. A set of rules and protocols that allows different software applications to communicate and interact with each other.",
    category: "Web Development",
    tags: ["integration", "web", "protocols"],
  },
  {
    id: "sql",
    term: "SQL",
    slug: "sql",
    definition:
      "Structured Query Language. A standard programming language specifically designed for managing, querying, and manipulating data stored in relational database management systems.",
    category: "DBMS",
    tags: ["databases", "queries", "storage"],
  },
  {
    id: "oop",
    term: "OOP",
    slug: "oop",
    definition:
      'Object-Oriented Programming. A programming paradigm based on the concept of "objects", which can contain data in the form of fields and code in the form of procedures.',
    category: "Programming",
    tags: ["paradigms", "fundamentals", "code-structure"],
  },
  {
    id: "rest",
    term: "REST",
    slug: "rest",
    definition:
      "Representational State Transfer. An architectural style for designing networked applications, relying on a stateless, client-server, cacheable communications protocol (typically HTTP).",
    category: "Web Development",
    tags: ["apis", "web-standards", "protocols"],
  },
  {
    id: "https",
    term: "HTTPS",
    slug: "https",
    definition:
      "HyperText Transfer Protocol Secure. An extension of the Hypertext Transfer Protocol (HTTP) used for secure communication over a computer network, encrypted using Transport Layer Security (TLS/SSL).",
    category: "Networking",
    tags: ["security", "encryption", "protocols"],
  },
];

/**
 * Get all unique categories from sample terms
 */
export function getCategories(): string[] {
  return Array.from(new Set(sampleTerms.map((t) => t.category)));
}

/**
 * Search terms locally (fallback when Elasticsearch is unavailable)
 * query like containerization
 */
export function searchTermsLocally(query: string): EngineeringTerm[] {
  // if query is empty after trimming then return first 10 terms
  if (!query.trim()) return sampleTerms.slice(0, 10);

  const normalizedQuery = query.toLowerCase();

  return sampleTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(normalizedQuery) ||
      term.definition.toLowerCase().includes(normalizedQuery) ||
      term.category.toLowerCase().includes(normalizedQuery) ||
      term.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
  );
}

/**
 * Get a term by its slug
 */
export function getTermBySlug(slug: string): EngineeringTerm | undefined {
  return sampleTerms.find((t) => t.slug === slug);
}

/**
 * Get related terms by tags with limit=3
 */
export function getRelatedTerms(
  term: EngineeringTerm,
  limit = 3,
): EngineeringTerm[] {
  return sampleTerms
    .filter(
      (t) => t.id !== term.id && t.tags.some((tag) => term.tags.includes(tag)),
    )
    .slice(0, limit);
}
