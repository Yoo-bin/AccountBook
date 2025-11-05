import api from './api';
import { Invitation, InviteUserRequest } from '@/types';

export const invitationService = {
  async inviteUser(data: InviteUserRequest): Promise<{ invitation: Invitation }> {
    const response = await api.post('/invitations', data);
    return response.data;
  },

  async getInvitation(token: string): Promise<{ invitation: Invitation }> {
    const response = await api.get(`/invitations/${token}`);
    return response.data;
  },

  async acceptInvitation(token: string): Promise<{ accountbook: any }> {
    const response = await api.post(`/invitations/${token}/accept`);
    return response.data;
  },

  async getPendingInvitations(accountbookId: number): Promise<{ invitations: Invitation[] }> {
    const response = await api.get(`/invitations/accountbook/${accountbookId}/pending`);
    return response.data;
  },
};
