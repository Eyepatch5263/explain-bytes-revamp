"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type EngineType = "btree" | "lsm";

interface LogEntry {
  timestamp: string;
  source: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

// B-Tree Interfaces
interface BTreeNode {
  id: string;
  keys: number[];
  type: "root" | "internal" | "leaf";
  x: number; // percentage width
  y: number; // pixels top
  childrenIds?: string[];
  isHighlighted?: boolean;
  isModified?: boolean;
}

// LSM-Tree Interfaces
interface WalEntry {
  id: string;
  op: "WRITE" | "DELETE";
  key: number;
  value: string;
}

interface MemTableEntry {
  key: number;
  value: string; // "TOMBSTONE" if deleted
}

interface Sstable {
  id: string;
  level: number;
  keys: number[];
  data: Record<number, string>;
  bloomFilter: number[]; // keys in this sstable
}

export default function DatabaseSimulation() {
  const [activeTab, setActiveTab] = useState<EngineType>("btree");
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStepText, setCurrentStepText] = useState<string>(
    "Select an operation below to start the visual execution.",
  );

  // Animation execution state
  const [activeSearchKey, setActiveSearchKey] = useState<number | null>(null);
  const [writeAmplificationAlert, setWriteAmplificationAlert] =
    useState<boolean>(false);

  // Console metrics
  const [randomReads, setRandomReads] = useState(0);
  const [randomWrites, setRandomWrites] = useState(0);
  const [bytesWritten, setBytesWritten] = useState(0);
  const [bytesRead, setBytesRead] = useState(0);

  // LSM state
  const [wal, setWal] = useState<WalEntry[]>([
    { id: "w1", op: "WRITE", key: 10, value: "Active" },
    { id: "w2", op: "WRITE", key: 50, value: "Pending" },
  ]);
  const [memTable, setMemTable] = useState<MemTableEntry[]>([
    { key: 10, value: "Active" },
    { key: 50, value: "Pending" },
  ]);
  const [sstables, setSstables] = useState<Sstable[]>([
    {
      id: "sst-0-1",
      level: 0,
      keys: [100, 200],
      data: { 100: "User A", 200: "User B" },
      bloomFilter: [100, 200],
    },
    {
      id: "sst-0-2",
      level: 0,
      keys: [150, 300],
      data: { 150: "User C", 300: "User D" },
      bloomFilter: [150, 300],
    },
    {
      id: "sst-1-1",
      level: 1,
      keys: [5, 20, 75],
      data: { 5: "User E", 20: "User F", 75: "User G" },
      bloomFilter: [5, 20, 75],
    },
  ]);

  // B-Tree Nodes State
  const [bTreeNodes, setBTreeNodes] = useState<Record<string, BTreeNode>>({
    root: {
      id: "root",
      keys: [100, 200],
      type: "root",
      x: 50,
      y: 30,
      childrenIds: ["int1", "int2", "int3"],
    },
    int1: {
      id: "int1",
      keys: [10, 50],
      type: "internal",
      x: 23,
      y: 130,
      childrenIds: ["leaf1", "leaf2", "leaf3"],
    },
    int2: {
      id: "int2",
      keys: [150, 180],
      type: "internal",
      x: 55,
      y: 130,
      childrenIds: ["leaf4", "leaf5"],
    },
    int3: {
      id: "int3",
      keys: [250, 300],
      type: "internal",
      x: 82,
      y: 130,
      childrenIds: ["leaf6", "leaf7"],
    },
    leaf1: { id: "leaf1", keys: [1, 5, 9], type: "leaf", x: 8, y: 240 },
    leaf2: { id: "leaf2", keys: [10, 20, 30, 40], type: "leaf", x: 20, y: 240 },
    leaf3: { id: "leaf3", keys: [50, 60, 70, 80], type: "leaf", x: 32, y: 240 },
    leaf4: { id: "leaf4", keys: [150, 160, 170], type: "leaf", x: 48, y: 240 },
    leaf5: { id: "leaf5", keys: [180, 190], type: "leaf", x: 62, y: 240 },
    leaf6: {
      id: "leaf6",
      keys: [250, 260, 270, 280],
      type: "leaf",
      x: 74,
      y: 240,
    },
    leaf7: { id: "leaf7", keys: [300, 310, 320], type: "leaf", x: 88, y: 240 },
  });

  const addLog = useCallback(
    (
      message: string,
      type: "info" | "success" | "warning" | "error" = "info",
      source: string = activeTab === "btree" ? "B-Tree Engine" : "LSM Engine",
    ) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [{ timestamp, message, type, source }, ...prev]);
    },
    [activeTab],
  );

  const handleReset = useCallback(() => {
    setLogs([]);
    setCurrentStepText("Simulation reset. Choose an operation to begin.");
    setActiveSearchKey(null);
    setWriteAmplificationAlert(false);
    setIsPlaying(false);
    setRandomReads(0);
    setRandomWrites(0);
    setBytesRead(0);
    setBytesWritten(0);

    // Reset B-Tree
    setBTreeNodes({
      root: {
        id: "root",
        keys: [100, 200],
        type: "root",
        x: 50,
        y: 30,
        childrenIds: ["int1", "int2", "int3"],
      },
      int1: {
        id: "int1",
        keys: [10, 50],
        type: "internal",
        x: 23,
        y: 130,
        childrenIds: ["leaf1", "leaf2", "leaf3"],
      },
      int2: {
        id: "int2",
        keys: [150, 180],
        type: "internal",
        x: 55,
        y: 130,
        childrenIds: ["leaf4", "leaf5"],
      },
      int3: {
        id: "int3",
        keys: [250, 300],
        type: "internal",
        x: 82,
        y: 130,
        childrenIds: ["leaf6", "leaf7"],
      },
      leaf1: { id: "leaf1", keys: [1, 5, 9], type: "leaf", x: 8, y: 240 },
      leaf2: {
        id: "leaf2",
        keys: [10, 20, 30, 40],
        type: "leaf",
        x: 20,
        y: 240,
      },
      leaf3: {
        id: "leaf3",
        keys: [50, 60, 70, 80],
        type: "leaf",
        x: 32,
        y: 240,
      },
      leaf4: {
        id: "leaf4",
        keys: [150, 160, 170],
        type: "leaf",
        x: 48,
        y: 240,
      },
      leaf5: { id: "leaf5", keys: [180, 190], type: "leaf", x: 62, y: 240 },
      leaf6: {
        id: "leaf6",
        keys: [250, 260, 270, 280],
        type: "leaf",
        x: 74,
        y: 240,
      },
      leaf7: {
        id: "leaf7",
        keys: [300, 310, 320],
        type: "leaf",
        x: 88,
        y: 240,
      },
    });

    // Reset LSM
    setWal([
      { id: "w1", op: "WRITE", key: 10, value: "Active" },
      { id: "w2", op: "WRITE", key: 50, value: "Pending" },
    ]);
    setMemTable([
      { key: 10, value: "Active" },
      { key: 50, value: "Pending" },
    ]);
    setSstables([
      {
        id: "sst-0-1",
        level: 0,
        keys: [100, 200],
        data: { 100: "User A", 200: "User B" },
        bloomFilter: [100, 200],
      },
      {
        id: "sst-0-2",
        level: 0,
        keys: [150, 300],
        data: { 150: "User C", 300: "User D" },
        bloomFilter: [150, 300],
      },
      {
        id: "sst-1-1",
        level: 1,
        keys: [5, 20, 75],
        data: { 5: "User E", 20: "User F", 75: "User G" },
        bloomFilter: [5, 20, 75],
      },
    ]);
  }, []);

  useEffect(() => {
    if (activeTab) {
      handleReset();
    }
  }, [activeTab, handleReset]);

  // B-Tree Helpers
  const highlightPath = (path: string[]) => {
    setBTreeNodes((prev) => {
      const copy = { ...prev };
      for (const key of Object.keys(copy)) {
        copy[key] = {
          ...copy[key],
          isHighlighted: path.includes(key),
        };
      }
      return copy;
    });
  };

  const flashNodeModified = (nodeId: string) => {
    setBTreeNodes((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], isModified: true },
    }));
    setTimeout(() => {
      setBTreeNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], isModified: false },
      }));
    }, 1200);
  };

  // 1. B-Tree Query / Search
  const runBtreeSearch = async (targetKey: number) => {
    setIsPlaying(true);
    setActiveSearchKey(targetKey);
    addLog(`Searching B-Tree for key ${targetKey}...`, "info");
    setRandomReads(0);

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    // Step 1: Root Node
    setCurrentStepText(
      `Checking Root Node. Key ${targetKey} is compared to [100, 200].`,
    );
    highlightPath(["root"]);
    setRandomReads((prev) => prev + 1);
    setBytesRead((prev) => prev + 4096);
    addLog("Reading Root Page (4KB)", "info");
    await delay(1200);

    let nextNode = "";
    if (targetKey < 100) {
      nextNode = "int1";
      setCurrentStepText(
        `${targetKey} < 100. Navigating to LEFT child (int1).`,
      );
    } else if (targetKey <= 200) {
      nextNode = "int2";
      setCurrentStepText(
        `100 <= ${targetKey} <= 200. Navigating to MIDDLE child (int2).`,
      );
    } else {
      nextNode = "int3";
      setCurrentStepText(
        `${targetKey} > 200. Navigating to RIGHT child (int3).`,
      );
    }
    highlightPath(["root", nextNode]);
    await delay(1200);

    // Step 2: Internal Node
    setRandomReads((prev) => prev + 1);
    setBytesRead((prev) => prev + 4096);
    addLog(`Reading Internal Page ${nextNode} (4KB)`, "info");
    if (nextNode === "int1") {
      setCurrentStepText(`Checking Internal Node int1 [10, 50].`);
      await delay(1000);
      let leafNode = "";
      if (targetKey < 10) {
        leafNode = "leaf1";
        setCurrentStepText(`${targetKey} < 10. Navigating to Leaf 1.`);
      } else if (targetKey <= 50) {
        leafNode = "leaf2";
        setCurrentStepText(`10 <= ${targetKey} <= 50. Navigating to Leaf 2.`);
      } else {
        leafNode = "leaf3";
        setCurrentStepText(`${targetKey} > 50. Navigating to Leaf 3.`);
      }
      highlightPath(["root", "int1", leafNode]);
      await delay(1200);

      // Step 3: Leaf Node
      setRandomReads((prev) => prev + 1);
      setBytesRead((prev) => prev + 4096);
      addLog(`Reading Leaf Page ${leafNode} (4KB)`, "info");
      const node = bTreeNodes[leafNode];
      const found = node.keys.includes(targetKey);
      if (found) {
        setCurrentStepText(
          `Key ${targetKey} FOUND in Leaf Node ${leafNode}! Reading completed in 3 page reads.`,
        );
        addLog(`Key ${targetKey} found in page ${leafNode}!`, "success");
      } else {
        setCurrentStepText(
          `Key ${targetKey} NOT found in Leaf Node ${leafNode}.`,
        );
        addLog(`Key ${targetKey} not present in tree.`, "warning");
      }
    } else if (nextNode === "int2") {
      setCurrentStepText(`Checking Internal Node int2 [150, 180].`);
      await delay(1000);
      let leafNode = "";
      if (targetKey < 150) {
        leafNode = "leaf4";
        setCurrentStepText(`${targetKey} < 150. Navigating to Leaf 4.`);
      } else {
        leafNode = "leaf5";
        setCurrentStepText(`${targetKey} >= 150. Navigating to Leaf 5.`);
      }
      highlightPath(["root", "int2", leafNode]);
      await delay(1200);

      setRandomReads((prev) => prev + 1);
      setBytesRead((prev) => prev + 4096);
      addLog(`Reading Leaf Page ${leafNode} (4KB)`, "info");
      const found = bTreeNodes[leafNode].keys.includes(targetKey);
      if (found) {
        setCurrentStepText(
          `Key ${targetKey} FOUND in Leaf Node ${leafNode}! Reading completed in 3 page reads.`,
        );
        addLog(`Key ${targetKey} found in page ${leafNode}!`, "success");
      } else {
        setCurrentStepText(
          `Key ${targetKey} NOT found in Leaf Node ${leafNode}.`,
        );
        addLog(`Key ${targetKey} not present in tree.`, "warning");
      }
    } else {
      setCurrentStepText(`Checking Internal Node int3 [250, 300].`);
      await delay(1000);
      let leafNode = "";
      if (targetKey < 250) {
        leafNode = "leaf6";
        setCurrentStepText(`${targetKey} < 250. Navigating to Leaf 6.`);
      } else {
        leafNode = "leaf7";
        setCurrentStepText(`${targetKey} >= 250. Navigating to Leaf 7.`);
      }
      highlightPath(["root", "int3", leafNode]);
      await delay(1200);

      setRandomReads((prev) => prev + 1);
      setBytesRead((prev) => prev + 4096);
      addLog(`Reading Leaf Page ${leafNode} (4KB)`, "info");
      const found = bTreeNodes[leafNode].keys.includes(targetKey);
      if (found) {
        setCurrentStepText(
          `Key ${targetKey} FOUND in Leaf Node ${leafNode}! Reading completed in 3 page reads.`,
        );
        addLog(`Key ${targetKey} found in page ${leafNode}!`, "success");
      } else {
        setCurrentStepText(
          `Key ${targetKey} NOT found in Leaf Node ${leafNode}.`,
        );
        addLog(`Key ${targetKey} not present in tree.`, "warning");
      }
    }

    setIsPlaying(false);
  };

  // 2. B-Tree In-Place Update (Write Amplification Demo)
  const runBtreeUpdate = async (targetKey: number) => {
    setIsPlaying(true);
    setActiveSearchKey(targetKey);
    addLog(`Initiating In-Place Update for Key ${targetKey}...`, "info");
    setRandomReads(0);
    setRandomWrites(0);
    setBytesWritten(0);

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    // Step 1: Traverse
    setCurrentStepText(
      `Step 1: Traversing the tree to find leaf containing key ${targetKey}.`,
    );
    highlightPath(["root", "int1", "leaf2"]);
    setRandomReads(3);
    setBytesRead(3 * 4096);
    addLog("Traversing tree nodes: Read 3 pages (12KB total)", "info");
    await delay(1500);

    // Step 2: Load and modify in memory
    setCurrentStepText(
      `Step 2: Key found in Leaf 2. Loading full page [10, 20, 30, 40] (4KB) into RAM and updating value (10 bytes changed).`,
    );
    addLog("Modifying 10 bytes in RAM page buffer", "info");
    await delay(1200);

    // Step 3: Write entire page back (Write Amplification!)
    setCurrentStepText(
      `Step 3: Database writes the ENTIRE 4KB block back to disk to update just 10 bytes! This is Write Amplification.`,
    );
    setRandomWrites(1);
    setBytesWritten(4096);
    setWriteAmplificationAlert(true);
    flashNodeModified("leaf2");
    addLog(
      "Disk write: 4096 bytes written (Write Amplification: 409x!)",
      "warning",
    );
    await delay(2000);

    setWriteAmplificationAlert(false);
    setCurrentStepText(
      "Update finished. B-Tree modified the block in-place sequentially on physical sector.",
    );
    setIsPlaying(false);
  };

  // 3. B-Tree Page Split Demo
  const runBtreeSplit = async () => {
    setIsPlaying(true);
    addLog("Initiating Split Demo: Inserting Key 25 into Leaf 2...", "info");
    setRandomReads(0);
    setRandomWrites(0);
    setBytesWritten(0);

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    // Step 1: Traversal
    setCurrentStepText(
      "Traversing B-Tree to find target insert page. Destination: Leaf 2.",
    );
    highlightPath(["root", "int1", "leaf2"]);
    setRandomReads(3);
    addLog("Reading pages to locate insert destination", "info");
    await delay(1200);

    // Step 2: Full check
    setCurrentStepText(
      "Leaf 2 [10, 20, 30, 40] is FULL (Maximum capacity of 4 keys reached). A Page Split is triggered!",
    );
    addLog("Page split detected: Destination leaf is full", "warning");
    await delay(1500);

    // Step 3: Split execution
    setCurrentStepText(
      "Creating a new Leaf page (Leaf 2-B). Distributing keys: Leaf 2 retains [10, 20], Leaf 2-B gets [25, 30, 40].",
    );
    addLog("Creating new page on disk", "info");

    setBTreeNodes((prev) => {
      const copy = { ...prev };
      copy.leaf2 = { ...copy.leaf2, keys: [10, 20], x: 17 };
      // add leaf2_b inline next to leaf2
      copy.leaf2_b = {
        id: "leaf2_b",
        keys: [25, 30, 40],
        type: "leaf",
        x: 26,
        y: 240,
      };
      // adjust spacing of other leaves slightly to make room
      copy.leaf3 = { ...copy.leaf3, x: 35 };
      return copy;
    });
    flashNodeModified("leaf2");
    setRandomWrites(2);
    setBytesWritten(8192); // 2 pages written
    await delay(2000);

    // Step 4: Parent node update
    setCurrentStepText(
      "Updating parent node (int1) to point to the new page. Inserting split boundary key 25.",
    );
    setBTreeNodes((prev) => {
      const copy = { ...prev };
      copy.int1 = {
        ...copy.int1,
        keys: [10, 25, 50],
        childrenIds: ["leaf1", "leaf2", "leaf2_b", "leaf3"],
      };
      return copy;
    });
    flashNodeModified("int1");
    setRandomWrites((prev) => prev + 1);
    setBytesWritten((prev) => prev + 4096);
    addLog("Parent Node updated in-place with new pointer", "success");
    await delay(2000);

    setCurrentStepText(
      "Page split complete. 3 page writes occurred. Parent pointers updated. The tree remains balanced.",
    );
    setIsPlaying(false);
  };

  // LSM-Tree Operations
  const runLsmWrite = async (key: number, val: string) => {
    setIsPlaying(true);
    addLog(`LSM Write: Inserting key ${key} = "${val}"`, "info");
    setRandomWrites(0);
    setBytesWritten(0);

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    // Step 1: WAL append
    setCurrentStepText(
      `Step 1: Appending operation to Write-Ahead Log (WAL) on disk. Extremely fast sequential append.`,
    );
    setWal((prev) => [
      ...prev,
      { id: `w-${Date.now()}`, op: "WRITE", key, value: val },
    ]);
    setBytesWritten(64); // small append
    addLog(
      "Appended insert operation to Write-Ahead Log (WAL) on disk",
      "info",
    );
    await delay(1200);

    // Step 2: Insert into MemTable
    setCurrentStepText(
      `Step 2: Inserting key ${key} into sorted MemTable in memory (RAM). Write completes instantly.`,
    );
    const nextMemTable = [...memTable, { key, value: val }].sort(
      (a, b) => a.key - b.key,
    );
    setMemTable(nextMemTable);
    addLog("Inserted key-value pair into in-memory MemTable", "success");
    await delay(1200);

    // Step 3: MemTable Capacity Check
    if (nextMemTable.length >= 3) {
      setCurrentStepText(
        "MemTable is full (size threshold reached)! Triggering flush to disk SSTable Level 0.",
      );
      addLog(
        "MemTable threshold exceeded. Initiating flush to disk.",
        "warning",
      );
      await delay(1500);

      // Flush to L0
      const newSstableId = `sst-0-${Date.now()}`;
      const keys = nextMemTable.map((m) => m.key);
      const data: Record<number, string> = {};
      for (const m of nextMemTable) {
        data[m.key] = m.value;
      }

      setSstables((prev) => [
        {
          id: newSstableId,
          level: 0,
          keys,
          data,
          bloomFilter: [...keys],
        },
        ...prev,
      ]);
      setMemTable([]);
      setBytesWritten(16384); // flushed file
      addLog(
        `Flushed MemTable to new SSTable ${newSstableId} (Level 0)`,
        "success",
      );
      setCurrentStepText(
        "MemTable flushed sequentially to disk as a new SSTable Level 0. MemTable memory is now empty.",
      );
      await delay(1500);
    } else {
      setCurrentStepText(
        "Write successful. Zero random disk I/O was executed.",
      );
    }

    setIsPlaying(false);
  };

  const runLsmDelete = async (key: number) => {
    setIsPlaying(true);
    addLog(`LSM Delete: Marking key ${key} as deleted`, "info");

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    // WAL append delete
    setCurrentStepText(
      `Appending DELETE operation (Tombstone) for key ${key} to WAL.`,
    );
    setWal((prev) => [
      ...prev,
      { id: `w-${Date.now()}`, op: "DELETE", key, value: "TOMBSTONE" },
    ]);
    await delay(1000);

    // MemTable Tombstone
    setCurrentStepText(
      `Inserting a Tombstone marker (deleted status) in MemTable for key ${key}. Outdated values on disk are NOT searched or updated.`,
    );
    setMemTable((prev) => {
      const filtered = prev.filter((m) => m.key !== key);
      const next = [...filtered, { key, value: "TOMBSTONE" }];
      return next.sort((a, b) => a.key - b.key);
    });
    addLog(`Inserted TOMBSTONE for key ${key} in MemTable`, "warning");
    await delay(1500);

    setCurrentStepText(
      "Delete complete. The record is logically deleted; actual cleanup happens during compaction.",
    );
    setIsPlaying(false);
  };

  const runLsmRead = async (targetKey: number) => {
    setIsPlaying(true);
    addLog(`Searching LSM-Tree for key ${targetKey}...`, "info");
    setRandomReads(0);
    setBytesRead(0);

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    // Step 1: MemTable check
    setCurrentStepText("Step 1: Checking in-memory MemTable first.");
    await delay(1000);
    const memMatch = memTable.find((m) => m.key === targetKey);
    if (memMatch) {
      if (memMatch.value === "TOMBSTONE") {
        setCurrentStepText(
          `Key ${targetKey} found in MemTable as a TOMBSTONE. Result: Key was DELETED.`,
        );
        addLog(`Key ${targetKey} matches Tombstone in MemTable`, "warning");
      } else {
        setCurrentStepText(
          `Key ${targetKey} found in MemTable! Value: "${memMatch.value}". Read completed in 0 disk access.`,
        );
        addLog(`Key found in MemTable: ${memMatch.value}`, "success");
      }
      setIsPlaying(false);
      return;
    }

    setCurrentStepText(
      `Key ${targetKey} not found in MemTable. Moving to disk SSTables.`,
    );
    await delay(1200);

    // Step 2: Loop SSTables
    let foundValue: string | null = null;
    let foundInSst = "";

    for (const sst of sstables) {
      setCurrentStepText(
        `Checking SSTable ${sst.id} (Level ${sst.level}). Running Bloom Filter first...`,
      );
      await delay(1000);

      const bloomPass = sst.bloomFilter.includes(targetKey);
      if (!bloomPass) {
        setCurrentStepText(
          `Bloom Filter says key ${targetKey} is NOT in SSTable ${sst.id}. Skipping disk check!`,
        );
        addLog(`Bloom filter skipped SSTable ${sst.id}`, "info");
        await delay(1000);
        continue;
      }

      setCurrentStepText(
        `Bloom Filter matched! Reading SSTable ${sst.id} index from disk...`,
      );
      setRandomReads((prev) => prev + 1);
      setBytesRead((prev) => prev + 4096);
      addLog(`Disk Read: Querying SSTable ${sst.id} index`, "info");
      await delay(1200);

      if (sst.keys.includes(targetKey)) {
        foundValue = sst.data[targetKey];
        foundInSst = sst.id;
        setCurrentStepText(
          `Key ${targetKey} FOUND in SSTable ${sst.id}! Value: "${foundValue}".`,
        );
        addLog(`Found key in SSTable ${sst.id}: ${foundValue}`, "success");
        await delay(1200);
        break; // Newest wins
      }
      setCurrentStepText(
        `Bloom Filter false-positive: Key ${targetKey} not in SSTable ${sst.id}. Continuing...`,
      );
      await delay(1000);
    }

    if (foundValue) {
      if (foundValue === "TOMBSTONE") {
        setCurrentStepText(
          `Key ${targetKey} resolved to a TOMBSTONE marker in ${foundInSst}. Result: Key was DELETED.`,
        );
      } else {
        setCurrentStepText(
          `Read complete. Key ${targetKey} found in SSTable ${foundInSst} on disk. Value: "${foundValue}".`,
        );
      }
    } else {
      setCurrentStepText(`Key ${targetKey} not found in any SSTables on disk.`);
      addLog(`Key ${targetKey} not found on disk.`, "error");
    }

    setIsPlaying(false);
  };

  const runLsmCompaction = async () => {
    setIsPlaying(true);
    addLog(
      "Triggering LSM Compaction (Clean & Merge Level 0 files)...",
      "warning",
    );

    const delay = (ms: number) =>
      new Promise((res) => setTimeout(res, ms / speed));

    setCurrentStepText(
      "Compaction process started: Reading Level 0 and Level 1 SSTables from disk...",
    );
    const l0Count = sstables.filter((s) => s.level === 0).length;
    const l1Count = sstables.filter((s) => s.level === 1).length;
    setRandomReads(l0Count + l1Count);
    setBytesRead((l0Count + l1Count) * 4096);
    await delay(1500);

    setCurrentStepText(
      "Sorting keys, merging data, and resolving overwrites in memory. Removing duplicate keys and tombstones.",
    );
    await delay(1500);

    // Merge logic: newer keys in sstables array take precedence.
    const mergedData: Record<number, string> = {};
    for (const sst of sstables) {
      for (const key of sst.keys) {
        if (mergedData[key] === undefined) {
          mergedData[key] = sst.data[key];
        }
      }
    }

    // Filter out tombstones and sort keys
    const finalData: Record<number, string> = {};
    for (const keyStr in mergedData) {
      const k = Number(keyStr);
      if (mergedData[k] !== "TOMBSTONE") {
        finalData[k] = mergedData[k];
      }
    }

    const mergedKeys = Object.keys(finalData)
      .map(Number)
      .sort((a, b) => a - b);

    setCurrentStepText(
      "Writing new, consolidated Level 1 SSTable to disk sequentially. Removing old files.",
    );
    setSstables([
      {
        id: "sst-1-merged",
        level: 1,
        keys: mergedKeys,
        data: finalData,
        bloomFilter: mergedKeys,
      },
    ]);

    setRandomWrites(1);
    setBytesWritten(16384);
    addLog(
      "Compaction completed: Merged Level 0 and Level 1 tables into a single Level 1 SSTable",
      "success",
    );
    await delay(1500);

    setCurrentStepText(
      "Compaction completed. Space cleaned, dead markers (Tombstones) cleared, and read performance restored.",
    );
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-zinc-900 dark:text-zinc-100 min-h-[500px]">
      {/* Simulation Controls Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
              Storage Engine Simulator
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              B-Trees (Mutable, Read-Optimized) vs LSM-Trees (Immutable,
              Write-Optimized)
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex p-0.5 rounded-xl bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("btree")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "btree"
                ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200",
            )}
          >
            B-Tree (Relational)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lsm")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "lsm"
                ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200",
            )}
          >
            LSM-Tree (Log-Structured)
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">Speed:</span>
          <div className="flex p-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-lg">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-mono font-bold rounded cursor-pointer",
                  speed === s
                    ? "bg-white dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                    : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-lg bg-zinc-150 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Canvas - Full Width */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 relative min-h-[380px] justify-between overflow-x-auto">
          {activeTab === "btree" ? (
            /* B-Tree Visualization Canvas */
            <div className="relative w-full h-[320px] min-w-[850px] select-none mt-2">
              {/* Connection Lines (SVG) */}
              <svg
                role="img"
                aria-label="B-Tree Connection Lines"
                className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-300 dark:stroke-zinc-800 stroke-[1.5] fill-none"
              >
                <title>B-Tree Connection Lines</title>
                {/* Root -> Internals */}
                <line
                  x1={`${bTreeNodes.root.x}%`}
                  y1="50"
                  x2={`${bTreeNodes.int1.x}%`}
                  y2="130"
                />
                <line
                  x1={`${bTreeNodes.root.x}%`}
                  y1="50"
                  x2={`${bTreeNodes.int2.x}%`}
                  y2="130"
                />
                <line
                  x1={`${bTreeNodes.root.x}%`}
                  y1="50"
                  x2={`${bTreeNodes.int3.x}%`}
                  y2="130"
                />

                {/* Internal 1 -> Leaves */}
                <line
                  x1={`${bTreeNodes.int1.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf1.x}%`}
                  y2="240"
                />
                <line
                  x1={`${bTreeNodes.int1.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf2.x}%`}
                  y2="240"
                />
                {bTreeNodes.leaf2_b && (
                  <line
                    x1={`${bTreeNodes.int1.x}%`}
                    y1="150"
                    x2={`${bTreeNodes.leaf2_b.x}%`}
                    y2="240"
                  />
                )}
                <line
                  x1={`${bTreeNodes.int1.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf3.x}%`}
                  y2="240"
                />

                {/* Internal 2 -> Leaves */}
                <line
                  x1={`${bTreeNodes.int2.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf4.x}%`}
                  y2="240"
                />
                <line
                  x1={`${bTreeNodes.int2.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf5.x}%`}
                  y2="240"
                />

                {/* Internal 3 -> Leaves */}
                <line
                  x1={`${bTreeNodes.int3.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf6.x}%`}
                  y2="240"
                />
                <line
                  x1={`${bTreeNodes.int3.x}%`}
                  y1="150"
                  x2={`${bTreeNodes.leaf7.x}%`}
                  y2="240"
                />
              </svg>

              {/* Render Nodes */}
              {Object.values(bTreeNodes).map((node) => {
                return (
                  <div
                    key={node.id}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}px`,
                      transform: "translateX(-50%)",
                    }}
                    className={cn(
                      "absolute flex flex-col items-center rounded-lg border px-3 py-1.5 shadow-sm text-xs font-mono font-bold transition-all duration-300",
                      node.isHighlighted
                        ? "bg-purple-100 dark:bg-purple-950/70 border-purple-500 text-purple-700 dark:text-purple-300 scale-105 ring-2 ring-purple-500/20"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
                      node.isModified &&
                        "bg-red-100 dark:bg-red-950/80 border-red-500 text-red-600 dark:text-red-400 animate-pulse",
                      node.type === "leaf" ? "w-[96px]" : "w-[105px]",
                    )}
                  >
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-bold mb-1">
                      {node.id}
                    </span>
                    <div className="flex gap-1 justify-center w-full">
                      {node.keys.map((k) => (
                        <span
                          key={k}
                          className={cn(
                            "px-1 py-0.5 rounded text-[10px]",
                            activeSearchKey === k
                              ? "bg-purple-550 dark:bg-purple-600 text-white font-black"
                              : "bg-zinc-100 dark:bg-zinc-800",
                          )}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LSM-Tree Visualization Canvas */
            <div className="flex flex-col gap-4 w-full h-[320px] min-w-[500px]">
              {/* RAM Section */}
              <div className="flex gap-4 border border-purple-200/50 dark:border-purple-900/30 bg-purple-500/5 dark:bg-purple-500/2 rounded-xl p-3">
                <div className="w-[30%] shrink-0">
                  <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 tracking-wider uppercase block mb-1.5">
                    MemTable (RAM Sorted Tree)
                  </span>
                  <div className="flex flex-col gap-1 min-h-[60px] bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2">
                    {memTable.length === 0 ? (
                      <span className="text-[10px] text-zinc-400 italic block m-auto">
                        Empty
                      </span>
                    ) : (
                      memTable.map((m) => (
                        <div
                          key={m.key}
                          className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded text-[10px] font-mono border border-zinc-200 dark:border-zinc-900"
                        >
                          <span className="font-bold text-purple-650 dark:text-purple-400">
                            k: {m.key}
                          </span>
                          <span className="truncate text-zinc-500 dark:text-zinc-400 max-w-[50px]">
                            {m.value}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                    Write-Ahead Log (WAL - Disk Append)
                  </span>
                  <div className="flex gap-2 overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 min-h-[60px] items-center">
                    {wal.length === 0 ? (
                      <span className="text-[10px] text-zinc-400 italic block m-auto">
                        Empty Log
                      </span>
                    ) : (
                      wal.map((w) => (
                        <div
                          key={w.id}
                          className="flex flex-col bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-900 text-[9px] font-mono min-w-[70px] shrink-0"
                        >
                          <span className="text-zinc-400 font-bold block border-b border-zinc-200 dark:border-zinc-800 pb-0.5 mb-0.5">
                            {w.op}
                          </span>
                          <span>k: {w.key}</span>
                          <span className="text-[8px] text-zinc-500 block truncate">
                            {w.value}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* SSTables (Disk Levels) Section */}
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {/* Level 0 (Immutable MemTable Flushes) */}
                <div className="flex items-center gap-2">
                  <span className="w-16 text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">
                    Level 0 (Disk)
                  </span>
                  <div className="flex-1 flex gap-3 overflow-x-auto">
                    {sstables
                      .filter((s) => s.level === 0)
                      .map((sst) => (
                        <div
                          key={sst.id}
                          className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 min-w-[120px]"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-1">
                            <span className="text-[9px] font-bold text-purple-650 dark:text-purple-400 font-mono">
                              {sst.id}
                            </span>
                            <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">
                              SST
                            </span>
                          </div>
                          {/* Bloom Filter values display */}
                          <div className="text-[8px] text-zinc-450 dark:text-zinc-500 block mb-1">
                            BF Keys: {sst.bloomFilter.join(", ")}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {sst.keys.map((k) => (
                              <div
                                key={k}
                                className="flex justify-between text-[9px] font-mono bg-zinc-50 dark:bg-zinc-950 px-1 py-0.5 rounded"
                              >
                                <span>{k}</span>
                                <span className="text-zinc-400 truncate max-w-[60px]">
                                  {sst.data[k]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    {sstables.filter((s) => s.level === 0).length === 0 && (
                      <span className="text-[10px] text-zinc-500 italic">
                        No Level 0 SSTables.
                      </span>
                    )}
                  </div>
                </div>

                {/* Level 1 (Compacted SSTables) */}
                <div className="flex items-center gap-2">
                  <span className="w-16 text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">
                    Level 1 (Disk)
                  </span>
                  <div className="flex-1 flex gap-3 overflow-x-auto">
                    {sstables
                      .filter((s) => s.level === 1)
                      .map((sst) => (
                        <div
                          key={sst.id}
                          className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 w-full max-w-[280px]"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-1">
                            <span className="text-[9px] font-bold text-blue-650 dark:text-blue-400 font-mono">
                              {sst.id}
                            </span>
                            <span className="text-[8px] bg-blue-50 dark:bg-blue-950/30 text-blue-500 px-1 py-0.5 rounded">
                              Compacted
                            </span>
                          </div>
                          <div className="text-[8px] text-zinc-450 dark:text-zinc-500 block mb-1">
                            BF Keys: {sst.bloomFilter.join(", ")}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {sst.keys.map((k) => (
                              <div
                                key={k}
                                className="flex justify-between text-[9px] font-mono bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded"
                              >
                                <span className="font-bold">{k}</span>
                                <span className="text-zinc-400 truncate max-w-[60px]">
                                  {sst.data[k]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Step Narration Container */}
          <div className="w-full mt-2 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-2.5 shadow-inner">
            <p className="text-[11px] font-medium leading-relaxed">
              {currentStepText}
            </p>
          </div>

          {/* Write Amplification Alert Overlay */}
          {writeAmplificationAlert && (
            <div className="absolute inset-0 bg-red-950/20 backdrop-blur-xs flex items-center justify-center rounded-2xl animate-fade-in z-20">
              <div className="bg-white dark:bg-zinc-900 border border-red-500 rounded-xl p-4 max-w-[320px] shadow-2xl text-center flex flex-col items-center gap-2">
                <span className="text-xs font-black uppercase text-red-500 tracking-wider">
                  Write Amplification Alert!
                </span>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  DB changed just 10 bytes of row data, but disk hardware forced
                  a rewrite of the entire 4096-byte (4KB) page!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lower Row Controls Box (2 Columns on Desktop) */}
        <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4">
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
            Operations Control Panel
          </h4>

          {activeTab === "btree" ? (
            /* B-Tree Controls */
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => runBtreeSearch(20)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Search Key 20</span>
                </button>

                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => runBtreeSearch(95)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Search Key 95</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isPlaying}
                onClick={() => runBtreeUpdate(20)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-650 dark:bg-zinc-900 hover:bg-purple-700 dark:hover:bg-purple-700 hover:text-white dark:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/10"
              >
                <span>Update Key 20 (In-Place)</span>
              </button>

              <button
                type="button"
                disabled={isPlaying}
                onClick={runBtreeSplit}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900 dark:bg-zinc-850 hover:bg-zinc-800 text-white dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer border border-zinc-800"
              >
                <span>Insert Key 25 (Trigger Split)</span>
              </button>
            </div>
          ) : (
            /* LSM Controls */
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => runLsmWrite(20, "User F")}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Write Key 20</span>
                </button>

                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => runLsmWrite(15, "User H")}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Write Key 15</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => runLsmRead(20)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Read Key 20</span>
                </button>

                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => runLsmDelete(10)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Delete Key 10</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isPlaying}
                onClick={runLsmCompaction}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-650 dark:bg-zinc-900 hover:bg-purple-700 dark:hover:bg-purple-700 hover:text-white dark:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/10"
              >
                <span>Trigger Compaction (Merge)</span>
              </button>
            </div>
          )}
        </div>

        {/* Lower Row Hardware Metrics (1 Column on Desktop) */}
        <div className="lg:col-span-1 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm p-4">
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Disk I/O Cost Metrics</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
              <span className="text-[10px] text-zinc-450 block font-bold mb-1">
                Random Reads
              </span>
              <span className="font-mono text-base font-black">
                {randomReads}
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
              <span className="text-[10px] text-zinc-450 block font-bold mb-1">
                Random Writes
              </span>
              <span className="font-mono text-base font-black">
                {randomWrites}
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
              <span className="text-[10px] text-zinc-450 block font-bold mb-1">
                Bytes Read
              </span>
              <span className="font-mono text-xs font-black">
                {bytesRead > 0 ? `${(bytesRead / 1024).toFixed(1)} KB` : "0 B"}
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
              <span className="text-[10px] text-zinc-450 block font-bold mb-1">
                Bytes Written
              </span>
              <span className="font-mono text-xs font-black">
                {bytesWritten > 0
                  ? bytesWritten >= 1024
                    ? `${(bytesWritten / 1024).toFixed(1)} KB`
                    : `${bytesWritten} B`
                  : "0 B"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal / Live Console Log Output */}
      <div className="bg-zinc-250 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-4 font-mono">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-zinc-800 dark:text-zinc-200 font-bold ml-1">
              PHYSICAL ENGINE CONSOLE
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-300 font-bold">
            DISK SECTORS: ACTIVE
          </span>
        </div>

        <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1 text-[11px]">
          {logs.length === 0 ? (
            <span className="text-zinc-800 dark:text-zinc-200 italic">
              Console idle. Start an operation above...
            </span>
          ) : (
            logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="flex items-start gap-2 border-b border-zinc-850/20 py-0.5"
              >
                <span className="text-zinc-550 dark:text-zinc-500 font-bold shrink-0">
                  [{log.timestamp}]
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1 rounded shrink-0 font-bold uppercase",
                    log.type === "success" && "bg-green-950/40 text-green-400",
                    log.type === "warning" &&
                      "bg-yellow-950/40 text-yellow-400",
                    log.type === "error" && "bg-red-950/40 text-red-400",
                    log.type === "info" && "bg-zinc-800 text-zinc-400",
                  )}
                >
                  {log.source}
                </span>
                <span
                  className={cn(
                    log.type === "success" && "text-green-300",
                    log.type === "warning" && "text-yellow-300",
                    log.type === "error" && "text-red-300",
                    log.type === "info" && "text-zinc-300",
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
