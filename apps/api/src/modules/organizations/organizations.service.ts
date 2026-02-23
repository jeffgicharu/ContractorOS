import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateOrganizationSettings } from '@contractor-os/shared';
import { OrganizationsRepository } from './organizations.repository';

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  settings: {
    defaultPaymentTerms: string;
    defaultCurrency: string;
    reminderDays: number[];
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly repo: OrganizationsRepository) {}

  async getOrganization(orgId: string): Promise<OrganizationDto> {
    const row = await this.repo.findById(orgId);
    if (!row) {
      throw new NotFoundException('Organization not found');
    }
    return this.mapRow(row);
  }

  async updateSettings(
    orgId: string,
    dto: UpdateOrganizationSettings,
  ): Promise<OrganizationDto> {
    const existing = await this.repo.findById(orgId);
    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const currentSettings = (existing.settings ?? {}) as Record<string, unknown>;
    const mergedSettings: Record<string, unknown> = { ...currentSettings };

    if (dto.defaultPaymentTerms !== undefined) {
      mergedSettings.defaultPaymentTerms = dto.defaultPaymentTerms;
    }
    if (dto.defaultCurrency !== undefined) {
      mergedSettings.defaultCurrency = dto.defaultCurrency;
    }
    if (dto.reminderDays !== undefined) {
      mergedSettings.reminderDays = dto.reminderDays;
    }

    const updated = await this.repo.updateNameAndSettings(
      orgId,
      dto.name,
      mergedSettings,
    );
    return this.mapRow(updated);
  }

  private mapRow(row: {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }): OrganizationDto {
    const settings = row.settings ?? {};
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      settings: {
        defaultPaymentTerms: (settings.defaultPaymentTerms as string) ?? 'net_30',
        defaultCurrency: (settings.defaultCurrency as string) ?? 'USD',
        reminderDays: (settings.reminderDays as number[]) ?? [7, 3, 1],
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
