import { eq, and, desc } from 'drizzle-orm';
import { fileAttachments, linkAttachments } from './schema';
import type {
  FileAttachment,
  LinkAttachment,
  CreateFileAttachmentInput,
  CreateLinkAttachmentInput,
  UpdateAttachmentInput,
} from './types';
import { validateFileAttachment, validateLinkAttachment } from './validators';

/**
 * Database type - accepts any Drizzle database instance
 */
export type Database = {
  select: () => any;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
};

/**
 * Attachment service for managing file and link attachments
 * Works with any database connection and entity type
 */
export class AttachmentService {
  constructor(private db: Database) {}

  /**
   * Create a file attachment
   */
  async createFileAttachment(
    input: CreateFileAttachmentInput
  ): Promise<FileAttachment> {
    // Validate input
    const validation = validateFileAttachment(input);
    if (!validation.valid) {
      throw new Error(`Invalid file attachment input: ${validation.error}`);
    }

    const [result] = await this.db
      .insert(fileAttachments)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        orgId: input.orgId,
        userId: input.userId,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        fileUrl: input.fileUrl,
        width: input.width,
        height: input.height,
        thumbnailUrl: input.thumbnailUrl,
      })
      .returning();

    return this.mapFileAttachment(result);
  }

  /**
   * Create a link attachment
   */
  async createLinkAttachment(
    input: CreateLinkAttachmentInput
  ): Promise<LinkAttachment> {
    // Validate input
    const validation = validateLinkAttachment(input);
    if (!validation.valid) {
      throw new Error(`Invalid link attachment input: ${validation.error}`);
    }

    const [result] = await this.db
      .insert(linkAttachments)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        orgId: input.orgId,
        userId: input.userId,
        url: input.url,
        title: input.title,
        description: input.description,
        favicon: input.favicon,
        imageUrl: input.imageUrl,
      })
      .returning();

    return this.mapLinkAttachment(result);
  }

  /**
   * Get file attachments for an entity
   */
  async getFileAttachments(
    entityType: string,
    entityId: string,
    orgId: string
  ): Promise<FileAttachment[]> {
    const results = await this.db
      .select()
      .from(fileAttachments)
      .where(
        and(
          eq(fileAttachments.entityType, entityType),
          eq(fileAttachments.entityId, entityId),
          eq(fileAttachments.orgId, orgId)
        )
      )
      .orderBy(desc(fileAttachments.createdAt));

    return results.map((r) => this.mapFileAttachment(r));
  }

  /**
   * Get link attachments for an entity
   */
  async getLinkAttachments(
    entityType: string,
    entityId: string,
    orgId: string
  ): Promise<LinkAttachment[]> {
    const results = await this.db
      .select()
      .from(linkAttachments)
      .where(
        and(
          eq(linkAttachments.entityType, entityType),
          eq(linkAttachments.entityId, entityId),
          eq(linkAttachments.orgId, orgId)
        )
      )
      .orderBy(desc(linkAttachments.createdAt));

    return results.map((r) => this.mapLinkAttachment(r));
  }

  /**
   * Get a file attachment by ID
   */
  async getFileAttachmentById(
    id: string,
    orgId: string
  ): Promise<FileAttachment | null> {
    const [result] = await this.db
      .select()
      .from(fileAttachments)
      .where(and(eq(fileAttachments.id, id), eq(fileAttachments.orgId, orgId)))
      .limit(1);

    return result ? this.mapFileAttachment(result) : null;
  }

  /**
   * Get a link attachment by ID
   */
  async getLinkAttachmentById(
    id: string,
    orgId: string
  ): Promise<LinkAttachment | null> {
    const [result] = await this.db
      .select()
      .from(linkAttachments)
      .where(and(eq(linkAttachments.id, id), eq(linkAttachments.orgId, orgId)))
      .limit(1);

    return result ? this.mapLinkAttachment(result) : null;
  }

  /**
   * Update a file attachment
   */
  async updateFileAttachment(
    id: string,
    orgId: string,
    input: UpdateAttachmentInput
  ): Promise<FileAttachment> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.fileName !== undefined) {
      updateData.fileName = input.fileName;
    }

    const [result] = await this.db
      .update(fileAttachments)
      .set(updateData)
      .where(and(eq(fileAttachments.id, id), eq(fileAttachments.orgId, orgId)))
      .returning();

    if (!result) {
      throw new Error('File attachment not found');
    }

    return this.mapFileAttachment(result);
  }

  /**
   * Update a link attachment
   */
  async updateLinkAttachment(
    id: string,
    orgId: string,
    input: UpdateAttachmentInput
  ): Promise<LinkAttachment> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    const [result] = await this.db
      .update(linkAttachments)
      .set(updateData)
      .where(
        and(eq(linkAttachments.id, id), eq(linkAttachments.orgId, orgId))
      )
      .returning();

    if (!result) {
      throw new Error('Link attachment not found');
    }

    return this.mapLinkAttachment(result);
  }

  /**
   * Delete a file attachment
   */
  async deleteFileAttachment(id: string, orgId: string): Promise<void> {
    const result = await this.db
      .delete(fileAttachments)
      .where(and(eq(fileAttachments.id, id), eq(fileAttachments.orgId, orgId)));

    if (result.rowCount === 0) {
      throw new Error('File attachment not found');
    }
  }

  /**
   * Delete a link attachment
   */
  async deleteLinkAttachment(id: string, orgId: string): Promise<void> {
    const result = await this.db
      .delete(linkAttachments)
      .where(
        and(eq(linkAttachments.id, id), eq(linkAttachments.orgId, orgId))
      );

    if (result.rowCount === 0) {
      throw new Error('Link attachment not found');
    }
  }

  /**
   * Delete all attachments for an entity
   */
  async deleteEntityAttachments(
    entityType: string,
    entityId: string,
    orgId: string
  ): Promise<void> {
    await this.db
      .delete(fileAttachments)
      .where(
        and(
          eq(fileAttachments.entityType, entityType),
          eq(fileAttachments.entityId, entityId),
          eq(fileAttachments.orgId, orgId)
        )
      );

    await this.db
      .delete(linkAttachments)
      .where(
        and(
          eq(linkAttachments.entityType, entityType),
          eq(linkAttachments.entityId, entityId),
          eq(linkAttachments.orgId, orgId)
        )
      );
  }

  /**
   * Map database result to FileAttachment type
   */
  private mapFileAttachment(row: any): FileAttachment {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      orgId: row.orgId,
      userId: row.userId,
      fileName: row.fileName,
      fileType: row.fileType,
      fileSize: row.fileSize,
      fileUrl: row.fileUrl,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Map database result to LinkAttachment type
   */
  private mapLinkAttachment(row: any): LinkAttachment {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      orgId: row.orgId,
      userId: row.userId,
      url: row.url,
      title: row.title ?? undefined,
      description: row.description ?? undefined,
      favicon: row.favicon ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

/**
 * Create an attachment service instance
 */
export function createAttachmentService(db: Database) {
  return new AttachmentService(db);
}

