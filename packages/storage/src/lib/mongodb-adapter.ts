import { MongoClient, Db, Collection } from 'mongodb';
import { Program, Execution } from '@cvm/types';
import { StorageAdapter } from './storage.js';

export class MongoDBAdapter implements StorageAdapter {
  private client: MongoClient;
  private db: Db | null = null;
  private connected = false;

  constructor(private connectionString: string) {
    this.client = new MongoClient(connectionString);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    const dbName = this.connectionString.split('/').pop()?.split('?')[0] || 'cvm';
    this.db = this.client.db(dbName);
    this.connected = true;

    // Ensure collections exist
    const collections = await this.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('programs')) {
      await this.db.createCollection('programs');
    }
    if (!collectionNames.includes('executions')) {
      await this.db.createCollection('executions');
    }
    if (!collectionNames.includes('outputs')) {
      await this.db.createCollection('outputs');
    }
    if (!collectionNames.includes('metadata')) {
      await this.db.createCollection('metadata');
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    this.connected = false;
    this.db = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getCollections(): Promise<string[]> {
    if (!this.db) throw new Error('Not connected to database');
    const collections = await this.db.listCollections().toArray();
    return collections.map(c => c.name);
  }

  private getCollection<T extends object>(name: string): Collection<T> {
    if (!this.db) throw new Error('Not connected to database');
    return this.db.collection<T>(name);
  }

  async saveProgram(program: Program): Promise<void> {
    const collection = this.getCollection<Program>('programs');
    await collection.replaceOne(
      { id: program.id },
      program,
      { upsert: true }
    );
  }

  async getProgram(id: string): Promise<Program | null> {
    const collection = this.getCollection<Program>('programs');
    return await collection.findOne({ id });
  }

  async saveExecution(execution: Execution): Promise<void> {
    const collection = this.getCollection<Execution>('executions');
    await collection.replaceOne(
      { id: execution.id },
      execution,
      { upsert: true }
    );
  }

  async getExecution(id: string): Promise<Execution | null> {
    const collection = this.getCollection<Execution>('executions');
    return await collection.findOne({ id });
  }

  async appendOutput(executionId: string, lines: string[]): Promise<void> {
    const collection = this.getCollection<{ executionId: string; lines: string[] }>('outputs');
    
    // Check if document exists
    const existing = await collection.findOne({ executionId });
    
    if (existing) {
      // Append to existing lines
      await collection.updateOne(
        { executionId },
        { $push: { lines: { $each: lines } } }
      );
    } else {
      // Create new document
      await collection.insertOne({ executionId, lines });
    }
  }

  async getOutput(executionId: string): Promise<string[]> {
    const collection = this.getCollection<{ executionId: string; lines: string[] }>('outputs');
    const result = await collection.findOne({ executionId });
    return result?.lines || [];
  }

  async listExecutions(): Promise<Execution[]> {
    const collection = this.getCollection<Execution>('executions');
    return await collection.find({}).toArray();
  }

  async getCurrentExecutionId(): Promise<string | null> {
    const collection = this.getCollection<{ _id: string; currentExecutionId: string | null }>('metadata');
    const result = await collection.findOne({ _id: 'current' });
    return result?.currentExecutionId || null;
  }

  async setCurrentExecutionId(executionId: string | null): Promise<void> {
    const collection = this.getCollection<{ _id: string; currentExecutionId: string | null }>('metadata');
    await collection.replaceOne(
      { _id: 'current' },
      { _id: 'current', currentExecutionId: executionId } as any,
      { upsert: true }
    );
  }

  async deleteExecution(executionId: string): Promise<void> {
    // Delete from executions collection
    const executionsCollection = this.getCollection<Execution>('executions');
    await executionsCollection.deleteOne({ id: executionId });
    
    // Delete associated output
    const outputsCollection = this.getCollection<{ executionId: string }>('outputs');
    await outputsCollection.deleteOne({ executionId });
    
    // If this was the current execution, clear it
    const currentId = await this.getCurrentExecutionId();
    if (currentId === executionId) {
      await this.setCurrentExecutionId(null);
    }
  }

  async listPrograms(): Promise<Program[]> {
    const collection = this.getCollection<Program>('programs');
    return await collection.find({}).toArray();
  }

  async deleteProgram(id: string): Promise<void> {
    const collection = this.getCollection<Program>('programs');
    await collection.deleteOne({ id });
  }

}