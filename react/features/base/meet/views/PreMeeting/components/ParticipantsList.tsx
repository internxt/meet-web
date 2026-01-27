import React from "react";
import { Avatar } from "@internxt/ui";
import { MeetingUser } from "../../../services/types/meeting.types";

interface ParticipantsListProps {
    participants: MeetingUser[];
    translate: (key: string) => string;
}

const ParticipantsList = ({ participants, translate }: ParticipantsListProps) => {
    const participantsNumber = participants.length;

    return (
        <div className="flex flex-col items-center justify-center mb-5">
            <span className="text-base font-normal text-white/75">
                {participantsNumber}{" "}
                {participantsNumber === 1
                    ? translate("meet.preMeeting.participant")
                    : translate("meet.preMeeting.participants")}
            </span>
            <div className="flex items-center">
                <div className="flex -space-x-3">
                    {participants.map((participant, index) => (
                        <div
                            key={index}
                            className="relative rounded-full bg-gray-90 dark:bg-gray-1 border border-white/15"
                        >
                            <Avatar
                                fullName={participant.name}
                                src={participant?.avatar}
                                size="sm"
                                className="bg-gray-90 dark:bg-gray-1 text-white"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParticipantsList;
