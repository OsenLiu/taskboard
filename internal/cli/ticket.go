package cli

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/tcarac/taskboard/internal/models"
)

func ticketCommands() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "ticket",
		Short: "Manage tickets",
	}

	var projectID, status, priority string
	listCmd := &cobra.Command{
		Use:   "list",
		Short: "List tickets",
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := openStore()
			if err != nil {
				return err
			}
			tickets, err := store.ListTickets(models.TicketFilter{
				ProjectID: projectID,
				Status:    status,
				Priority:  priority,
			})
			if err != nil {
				return err
			}
			if len(tickets) == 0 {
				fmt.Println("No tickets found.")
				return nil
			}
			for _, t := range tickets {
				key := t.DisplayKey()
				fmt.Printf("[%s] %s - %s (%s, %s)\n", key, t.Title, t.Status, t.Priority, t.ID)
			}
			return nil
		},
	}
	listCmd.Flags().StringVar(&projectID, "project", "", "filter by project ID")
	listCmd.Flags().StringVar(&status, "status", "", "filter by status (backlog|todo|in_progress|done)")
	listCmd.Flags().StringVar(&priority, "priority", "", "filter by priority (urgent|high|medium|low)")

	nextCmd := &cobra.Command{
		Use:   "next",
		Short: "Print the next actionable ticket for AI automation",
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := openStore()
			if err != nil {
				return err
			}
			ticket, err := store.NextActionableTicket()
			if err != nil {
				return err
			}
			if ticket == nil {
				return nil
			}
			model := ""
			if ticket.AIModel != nil {
				model = *ticket.AIModel
			}
			fmt.Printf("%s\n%s\n%s\n", ticket.ID, model, ticket.Folder)
			return nil
		},
	}

	var createProject, createPriority, createDue, createTeam, createAIModel string
	createCmd := &cobra.Command{
		Use:   "create",
		Short: "Create a new ticket",
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := openStore()
			if err != nil {
				return err
			}
			title, _ := cmd.Flags().GetString("title")
			req := models.CreateTicketRequest{
				ProjectID: createProject,
				Title:     title,
				Priority:  createPriority,
			}
			if createDue != "" {
				req.DueDate = &createDue
			}
			if createTeam != "" {
				req.TeamID = &createTeam
			}
			if createAIModel != "" {
				req.AIModel = &createAIModel
			}
			t, err := store.CreateTicket(req)
			if err != nil {
				return err
			}
			fmt.Printf("Created ticket %s: %s (%s)\n", t.DisplayKey(), t.Title, t.ID)
			return nil
		},
	}
	createCmd.Flags().StringVar(&createProject, "project", "", "project ID (required)")
	createCmd.MarkFlagRequired("project")
	createCmd.Flags().String("title", "", "ticket title (required)")
	createCmd.MarkFlagRequired("title")
	createCmd.Flags().StringVar(&createPriority, "priority", "medium", "priority (urgent|high|medium|low)")
	createCmd.Flags().StringVar(&createDue, "due", "", "due date (YYYY-MM-DD)")
	createCmd.Flags().StringVar(&createTeam, "team", "", "team ID")
	createCmd.Flags().StringVar(&createAIModel, "ai-model", "", "Copilot model override")

	var moveStatus string
	moveCmd := &cobra.Command{
		Use:   "move [id]",
		Short: "Move ticket to different status",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := openStore()
			if err != nil {
				return err
			}
			t, err := store.MoveTicket(args[0], models.MoveTicketRequest{Status: moveStatus})
			if err != nil {
				return err
			}
			if t == nil {
				return fmt.Errorf("ticket not found")
			}
			fmt.Printf("Moved %s to %s\n", t.DisplayKey(), t.Status)
			return nil
		},
	}
	moveCmd.Flags().StringVar(&moveStatus, "status", "", "target status (backlog|todo|in_progress|done; required)")
	moveCmd.MarkFlagRequired("status")

	deleteCmd := &cobra.Command{
		Use:   "delete [id]",
		Short: "Delete a ticket",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := openStore()
			if err != nil {
				return err
			}
			if err := store.DeleteTicket(args[0]); err != nil {
				return err
			}
			fmt.Println("Ticket deleted.")
			return nil
		},
	}

	cmd.AddCommand(listCmd, nextCmd, createCmd, moveCmd, deleteCmd)
	return cmd
}
