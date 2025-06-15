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

}