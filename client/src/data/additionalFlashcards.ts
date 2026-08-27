/** Source: existing public Explain Bytes flashcard decks. */
import type { Flashcard } from "@/data/systemDesignFlashcards";

export const operatingSystemsFlashcards: Flashcard[] = [
  {
    "id": "os-1",
    "question": "What is the difference between a process and a thread?",
    "answer": "Process: independent program with own memory space, heavyweight, isolated, IPC needed for communication. Thread: lightweight unit within process, shares memory/resources, faster creation/switching, less overhead. Multiple threads in one process. Process = house, thread = room."
  },
  {
    "id": "os-2",
    "question": "Explain the different CPU scheduling algorithms.",
    "answer": "FCFS: first-come-first-served, simple, convoy effect. SJF: shortest job first, optimal average wait, starvation possible. Round Robin: time quantum, fair, context switching overhead. Priority: based on priority, aging prevents starvation. Multilevel Queue: separate queues by priority."
  },
  {
    "id": "os-3",
    "question": "What is a deadlock and what are its necessary conditions?",
    "answer": "Deadlock: processes wait indefinitely for resources. Four necessary conditions: 1) Mutual Exclusion (exclusive resource access), 2) Hold and Wait (hold while waiting), 3) No Preemption (can't force release), 4) Circular Wait (circular dependency). All four must exist for deadlock."
  },
  {
    "id": "os-4",
    "question": "Explain virtual memory and paging.",
    "answer": "Virtual memory extends RAM using disk storage, allows larger programs than physical RAM. Paging divides memory into fixed-size pages, maps virtual to physical addresses via page table. Benefits: isolation, larger address space. Page fault occurs when page not in RAM, OS loads from disk."
  },
  {
    "id": "os-5",
    "question": "What is the difference between kernel mode and user mode?",
    "answer": "Kernel mode: full hardware access, privileged instructions, OS core runs here, crashes can freeze system. User mode: restricted access, applications run here, system calls to access hardware, crashes isolated. Mode switching via interrupts/system calls. Protects system stability and security."
  },
  {
    "id": "os-6",
    "question": "Explain the difference between internal and external fragmentation.",
    "answer": "Internal fragmentation: wasted space within allocated memory blocks (allocated > needed). External fragmentation: free memory scattered in small blocks, can't satisfy large requests. Paging has internal fragmentation. Segmentation has external fragmentation. Compaction and paging reduce fragmentation."
  },
  {
    "id": "os-7",
    "question": "What is a semaphore and how does it work?",
    "answer": "Semaphore: synchronization primitive with integer counter. Binary semaphore (mutex): 0 or 1, mutual exclusion. Counting semaphore: multiple resources. Operations: wait/P (decrement, block if 0), signal/V (increment, wake waiting). Prevents race conditions, coordinates access to shared resources."
  },
  {
    "id": "os-8",
    "question": "Explain the producer-consumer problem and its solution.",
    "answer": "Producer creates items, consumer uses them, share bounded buffer. Problems: buffer overflow, underflow, race conditions. Solution: semaphores (empty, full, mutex) or monitors. Empty counts free slots, full counts filled slots, mutex ensures mutual exclusion. Classic synchronization problem."
  },
  {
    "id": "os-9",
    "question": "What is thrashing and how can you prevent it?",
    "answer": "Thrashing: excessive paging, system spends more time swapping than executing. Causes: too many processes, insufficient RAM, poor page replacement. Prevention: reduce multiprogramming degree, increase RAM, working set model, page fault frequency algorithm, better page replacement (LRU)."
  },
  {
    "id": "os-10",
    "question": "Explain different page replacement algorithms.",
    "answer": "FIFO: replace oldest page, simple, Belady's anomaly. Optimal: replace page used farthest in future, theoretical. LRU: replace least recently used, good performance, expensive. Clock/Second Chance: FIFO with reference bit, approximates LRU. LFU: replace least frequently used."
  },
  {
    "id": "os-11",
    "question": "What is a context switch and why is it expensive?",
    "answer": "Context switch: saving current process state and loading another's state. Includes: registers, program counter, stack pointer, page tables. Expensive because: CPU does no useful work, cache invalidation, TLB flush, pipeline stall. Threads cheaper to switch than processes."
  },
  {
    "id": "os-12",
    "question": "Explain the difference between preemptive and non-preemptive scheduling.",
    "answer": "Preemptive: OS can interrupt running process, better responsiveness, prevents monopolization, more overhead (Round Robin, Priority). Non-preemptive: process runs until completion or blocks, simpler, less overhead, poor responsiveness (FCFS, SJF). Modern OS use preemptive for better user experience."
  },
  {
    "id": "os-13",
    "question": "What is the difference between a mutex and a semaphore?",
    "answer": "Mutex: binary lock (0/1), ownership (only owner can unlock), mutual exclusion only. Semaphore: counter (0 to N), no ownership, signaling and mutual exclusion. Mutex for protecting critical sections. Semaphore for resource counting and signaling. Mutex is special case of binary semaphore."
  },
  {
    "id": "os-14",
    "question": "Explain the concept of a critical section.",
    "answer": "Critical section: code segment accessing shared resources, must execute atomically. Requirements: Mutual Exclusion (one at a time), Progress (decision can't postpone indefinitely), Bounded Waiting (limit on wait time). Solutions: locks, semaphores, monitors, Peterson's algorithm."
  },
  {
    "id": "os-15",
    "question": "What is the difference between hard and soft real-time systems?",
    "answer": "Hard real-time: deadlines must be met, failure catastrophic (airbags, pacemakers, nuclear reactors). Soft real-time: deadlines preferred but not critical, degraded performance acceptable (video streaming, gaming). Hard requires guaranteed response times, soft allows best-effort."
  },
  {
    "id": "os-16",
    "question": "Explain memory management techniques: segmentation vs paging.",
    "answer": "Paging: fixed-size blocks (pages), no external fragmentation, simple, internal fragmentation. Segmentation: variable-size logical units (code, data, stack), matches program structure, external fragmentation, complex. Segmented paging combines both: segments divided into pages."
  },
  {
    "id": "os-17",
    "question": "What is an interrupt and how does it work?",
    "answer": "Interrupt: signal to CPU from hardware/software requiring immediate attention. Types: hardware (I/O, timer), software (system calls, exceptions). Process: 1) Save state, 2) Identify interrupt, 3) Execute handler (ISR), 4) Restore state. Enables asynchronous I/O, multitasking."
  },
  {
    "id": "os-18",
    "question": "Explain the concept of a race condition.",
    "answer": "Race condition: outcome depends on timing/order of events, non-deterministic behavior. Occurs when multiple processes/threads access shared data concurrently without synchronization. Example: two threads incrementing counter simultaneously. Prevention: locks, semaphores, atomic operations, proper synchronization."
  },
  {
    "id": "os-19",
    "question": "What is the difference between monolithic and microkernel architectures?",
    "answer": "Monolithic: all OS services in kernel space, faster (direct calls), less modular, larger kernel, one crash affects all (Linux). Microkernel: minimal kernel, services in user space, slower (message passing), modular, more stable, easier to extend (Minix, QNX)."
  },
  {
    "id": "os-20",
    "question": "Explain the working set model in memory management.",
    "answer": "Working set: set of pages process actively uses in time window. Principle of locality: programs access small portion of address space at any time. OS allocates enough frames for working set to prevent thrashing. Working set size varies over time. Used for page replacement decisions."
  }
];

export const networkingFlashcards: Flashcard[] = [
  {
    "id": "networking-1",
    "question": "Explain the OSI model and its 7 layers.",
    "answer": "Physical (cables, signals), Data Link (MAC, switches), Network (IP, routing), Transport (TCP/UDP, ports), Session (connections), Presentation (encryption, formatting), Application (HTTP, FTP). Mnemonic: Please Do Not Throw Sausage Pizza Away. Each layer adds headers/trailers for encapsulation."
  },
  {
    "id": "networking-2",
    "question": "What is the difference between TCP and UDP?",
    "answer": "TCP: connection-oriented, reliable, ordered delivery, flow control, slower (HTTP, FTP, SSH). UDP: connectionless, unreliable, no ordering, faster, lower overhead (DNS, streaming, gaming). TCP = phone call, UDP = text message. Choose based on reliability vs speed needs."
  },
  {
    "id": "networking-3",
    "question": "How does the TCP three-way handshake work?",
    "answer": "1) Client sends SYN (synchronize) with sequence number. 2) Server responds SYN-ACK (acknowledge). 3) Client sends ACK. Establishes connection, agrees on sequence numbers, ensures both sides ready. Termination uses four-way handshake (FIN, ACK, FIN, ACK)."
  },
  {
    "id": "networking-4",
    "question": "What is DNS and how does it work?",
    "answer": "DNS (Domain Name System) translates domain names to IP addresses. Process: 1) Check local cache, 2) Query recursive resolver, 3) Query root server, 4) Query TLD server (.com), 5) Query authoritative nameserver, 6) Return IP. Uses UDP port 53, hierarchical structure."
  },
  {
    "id": "networking-5",
    "question": "Explain the difference between HTTP and HTTPS.",
    "answer": "HTTP transmits data in plaintext over port 80, vulnerable to eavesdropping. HTTPS encrypts data using TLS/SSL over port 443, provides authentication, integrity, and confidentiality. HTTPS requires SSL certificate, slightly slower but essential for security, SEO ranking factor."
  },
  {
    "id": "networking-6",
    "question": "What is a subnet mask and how does it work?",
    "answer": "Subnet mask divides IP address into network and host portions. Example: 255.255.255.0 (/24) means first 24 bits are network, last 8 bits are hosts (254 usable). CIDR notation: 192.168.1.0/24. Enables network segmentation, efficient IP allocation, routing."
  },
  {
    "id": "networking-7",
    "question": "What is NAT (Network Address Translation)?",
    "answer": "NAT translates private IP addresses to public IP addresses, allowing multiple devices to share one public IP. Types: Static (1:1 mapping), Dynamic (pool), PAT/NAPT (port-based, most common). Benefits: IP conservation, security (hides internal network), enables IPv4 continuation."
  },
  {
    "id": "networking-8",
    "question": "Explain how a CDN (Content Delivery Network) works.",
    "answer": "CDN distributes content across geographically dispersed servers (edge locations). When user requests content, CDN serves from nearest server. Benefits: reduced latency, lower bandwidth costs, improved availability, DDoS protection. Examples: Cloudflare, Akamai, AWS CloudFront."
  },
  {
    "id": "networking-9",
    "question": "What is the difference between IPv4 and IPv6?",
    "answer": "IPv4: 32-bit addresses (4.3B), dotted decimal (192.168.1.1), NAT required, broadcast. IPv6: 128-bit addresses (340 undecillion), hexadecimal (2001:0db8::1), no NAT needed, multicast, built-in security (IPsec), simplified header, auto-configuration."
  },
  {
    "id": "networking-10",
    "question": "What is a firewall and what are its types?",
    "answer": "Firewall filters network traffic based on rules. Types: Packet filtering (layer 3/4, stateless), Stateful (tracks connections), Application (layer 7, deep inspection), Next-gen (IPS, DPI, malware detection). Can be hardware or software. Protects against unauthorized access."
  },
  {
    "id": "networking-11",
    "question": "Explain the difference between a hub, switch, and router.",
    "answer": "Hub: layer 1, broadcasts to all ports, half-duplex, collision domain. Switch: layer 2, forwards to specific MAC address, full-duplex, separate collision domains. Router: layer 3, routes between networks using IP, NAT, firewall capabilities. Hub < Switch < Router in intelligence."
  },
  {
    "id": "networking-12",
    "question": "What is ARP (Address Resolution Protocol)?",
    "answer": "ARP maps IP addresses to MAC addresses in local network. Process: 1) Broadcast ARP request 'Who has IP X?', 2) Device with IP X responds with MAC address, 3) Requester caches mapping. ARP table stores mappings. Reverse ARP (RARP) maps MAC to IP."
  },
  {
    "id": "networking-13",
    "question": "What is the difference between latency and bandwidth?",
    "answer": "Latency: time for data to travel from source to destination (milliseconds), affected by distance, routing, processing. Bandwidth: maximum data transfer rate (Mbps/Gbps), like pipe width. Low latency + high bandwidth = ideal. Latency = speed, bandwidth = capacity."
  },
  {
    "id": "networking-14",
    "question": "Explain how load balancing works.",
    "answer": "Load balancer distributes traffic across multiple servers. Algorithms: Round Robin (sequential), Least Connections (least busy), IP Hash (consistent routing), Weighted (capacity-based). Types: Layer 4 (TCP/UDP), Layer 7 (HTTP). Benefits: scalability, high availability, fault tolerance."
  },
  {
    "id": "networking-15",
    "question": "What is SSL/TLS and how does the handshake work?",
    "answer": "SSL/TLS encrypts data in transit. Handshake: 1) Client Hello (supported ciphers), 2) Server Hello (chosen cipher, certificate), 3) Client verifies certificate, generates session key, 4) Both use session key for symmetric encryption. Provides authentication, encryption, integrity."
  },
  {
    "id": "networking-16",
    "question": "What is a VPN and how does it work?",
    "answer": "VPN (Virtual Private Network) creates encrypted tunnel over public network. Types: Site-to-Site (connects networks), Remote Access (connects users). Protocols: IPsec, OpenVPN, WireGuard. Benefits: privacy, security, bypass geo-restrictions, secure remote access. Encrypts all traffic."
  },
  {
    "id": "networking-17",
    "question": "Explain the difference between unicast, multicast, and broadcast.",
    "answer": "Unicast: one-to-one communication (specific destination). Multicast: one-to-many (specific group, e.g., video streaming). Broadcast: one-to-all (all devices in network). IPv4 supports all three. IPv6 uses anycast instead of broadcast. Multicast reduces bandwidth for group communication."
  },
  {
    "id": "networking-18",
    "question": "What is DHCP and how does it work?",
    "answer": "DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses. DORA process: Discover (client broadcasts), Offer (server offers IP), Request (client requests IP), Acknowledge (server confirms). Also provides subnet mask, gateway, DNS. Lease-based, reduces manual configuration."
  },
  {
    "id": "networking-19",
    "question": "What is the difference between connection-oriented and connectionless protocols?",
    "answer": "Connection-oriented (TCP): establishes connection before data transfer, reliable, ordered, error checking, overhead. Connectionless (UDP): no connection setup, unreliable, unordered, minimal overhead, faster. Connection-oriented = guaranteed delivery, connectionless = best effort."
  },
  {
    "id": "networking-20",
    "question": "Explain what a proxy server is and its types.",
    "answer": "Proxy server acts as intermediary between client and server. Forward proxy: client-side, caching, filtering, anonymity. Reverse proxy: server-side, load balancing, SSL termination, caching (Nginx). Transparent proxy: no client configuration. Benefits: security, performance, access control."
  }
];

export const dbmsFlashcards: Flashcard[] = [
  {
    "id": "dbms-1",
    "question": "What is the difference between SQL and NoSQL databases?",
    "answer": "SQL databases are relational, use structured schemas, support ACID transactions, and scale vertically (e.g., PostgreSQL, MySQL). NoSQL databases are non-relational, schema-flexible, support eventual consistency, and scale horizontally (e.g., MongoDB, Cassandra, Redis)."
  },
  {
    "id": "dbms-2",
    "question": "Explain ACID properties in databases.",
    "answer": "Atomicity: transactions are all-or-nothing. Consistency: data remains valid after transactions. Isolation: concurrent transactions don't interfere. Durability: committed data persists even after system failures. ACID ensures reliable transaction processing."
  },
  {
    "id": "dbms-3",
    "question": "What is database normalization and why is it important?",
    "answer": "Normalization organizes data to reduce redundancy and improve integrity. Forms: 1NF (atomic values), 2NF (no partial dependencies), 3NF (no transitive dependencies), BCNF (stricter 3NF). Benefits: less storage, easier updates, fewer anomalies. Trade-off: may require more joins."
  },
  {
    "id": "dbms-4",
    "question": "What is the difference between clustered and non-clustered indexes?",
    "answer": "Clustered index determines physical order of data rows (one per table), faster for range queries. Non-clustered index creates separate structure with pointers to data (multiple per table), faster for specific lookups. Clustered = dictionary, non-clustered = book index."
  },
  {
    "id": "dbms-5",
    "question": "Explain the CAP theorem.",
    "answer": "CAP states distributed systems can only guarantee 2 of 3: Consistency (all nodes see same data), Availability (system always responds), Partition tolerance (works despite network failures). CP systems (MongoDB), AP systems (Cassandra), CA impossible in distributed systems."
  },
  {
    "id": "dbms-6",
    "question": "What is a database transaction and how does it work?",
    "answer": "A transaction is a logical unit of work with multiple operations treated as single unit. Uses BEGIN, COMMIT (save changes), ROLLBACK (undo changes). Ensures ACID properties. Example: bank transfer debits one account and credits another atomically."
  },
  {
    "id": "dbms-7",
    "question": "What are database isolation levels?",
    "answer": "Read Uncommitted: dirty reads possible. Read Committed: only committed data visible. Repeatable Read: same query returns same results. Serializable: full isolation, no anomalies. Higher isolation = more consistency but less concurrency. Trade-off between consistency and performance."
  },
  {
    "id": "dbms-8",
    "question": "Explain database sharding and when to use it.",
    "answer": "Sharding horizontally partitions data across multiple databases/servers. Each shard contains subset of data. Benefits: horizontal scaling, improved performance, fault isolation. Challenges: complex queries across shards, rebalancing. Use when: vertical scaling insufficient, data too large for single server."
  },
  {
    "id": "dbms-9",
    "question": "What is the difference between DELETE, TRUNCATE, and DROP?",
    "answer": "DELETE removes rows based on condition, can be rolled back, triggers fire, slower. TRUNCATE removes all rows, faster, can't be rolled back (in most DBs), resets identity. DROP removes entire table structure and data, can't be rolled back."
  },
  {
    "id": "dbms-10",
    "question": "What is a deadlock and how can you prevent it?",
    "answer": "Deadlock occurs when two+ transactions wait for each other's locks indefinitely. Prevention: lock ordering (acquire locks in same order), timeouts, deadlock detection and rollback. Avoidance: shorter transactions, appropriate isolation levels, optimistic locking."
  },
  {
    "id": "dbms-11",
    "question": "Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN.",
    "answer": "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from left table plus matches from right (nulls if no match). RIGHT JOIN returns all rows from right table plus matches from left. FULL OUTER JOIN returns all rows from both."
  },
  {
    "id": "dbms-12",
    "question": "What is database replication and what are its types?",
    "answer": "Replication copies data across multiple databases for availability and performance. Master-Slave: one write node, multiple read replicas. Master-Master: multiple write nodes, conflict resolution needed. Synchronous: wait for replica confirmation. Asynchronous: don't wait, eventual consistency."
  },
  {
    "id": "dbms-13",
    "question": "What is the N+1 query problem and how do you solve it?",
    "answer": "N+1 problem: fetching N items requires 1 query + N additional queries for related data. Solution: eager loading (JOIN or IN clause), batch loading, caching, GraphQL DataLoader. Example: loading users then querying each user's posts separately."
  },
  {
    "id": "dbms-14",
    "question": "Explain optimistic vs pessimistic locking.",
    "answer": "Optimistic locking assumes conflicts are rare, checks version/timestamp before commit, retries on conflict. Pessimistic locking acquires locks immediately, blocks other transactions. Optimistic = better concurrency, more retries. Pessimistic = guaranteed success, less concurrency. Choose based on conflict frequency."
  },
  {
    "id": "dbms-15",
    "question": "What is a database view and when should you use it?",
    "answer": "A view is a virtual table based on a SQL query, doesn't store data. Benefits: simplify complex queries, security (hide columns), abstraction layer. Materialized views store results for performance. Use for: frequently used complex queries, row-level security, backward compatibility."
  },
  {
    "id": "dbms-16",
    "question": "What is database denormalization and when is it appropriate?",
    "answer": "Denormalization intentionally adds redundancy to improve read performance by reducing joins. Trade-offs: faster reads, slower writes, more storage, potential inconsistency. Appropriate for: read-heavy workloads, reporting databases, data warehouses, when performance critical."
  },
  {
    "id": "dbms-17",
    "question": "Explain the difference between OLTP and OLAP databases.",
    "answer": "OLTP (Online Transaction Processing): handles real-time transactions, normalized, row-oriented, fast writes, supports ACID (e.g., MySQL, PostgreSQL). OLAP (Online Analytical Processing): handles complex queries, denormalized, column-oriented, fast reads, aggregations (e.g., Snowflake, BigQuery)."
  },
  {
    "id": "dbms-18",
    "question": "What is a foreign key and why is it important?",
    "answer": "Foreign key is a column referencing primary key in another table, enforcing referential integrity. Ensures related data exists, prevents orphaned records. Actions: CASCADE (propagate changes), SET NULL, RESTRICT. Important for: data consistency, relationship enforcement, query optimization."
  },
  {
    "id": "dbms-19",
    "question": "What is database connection pooling?",
    "answer": "Connection pooling maintains a cache of database connections for reuse instead of creating new connections per request. Benefits: reduced overhead, faster response times, controlled resource usage. Configuration: min/max connections, timeout, idle timeout. Essential for high-traffic applications."
  },
  {
    "id": "dbms-20",
    "question": "Explain the difference between WHERE and HAVING clauses.",
    "answer": "WHERE filters rows before grouping, works on individual rows, can't use aggregate functions. HAVING filters groups after GROUP BY, works on aggregated data, can use aggregate functions. Example: WHERE filters users, HAVING filters groups like 'departments with >10 employees'."
  }
];
