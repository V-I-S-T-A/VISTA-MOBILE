import AccountHeader from "../../../components/common/AccountHeader";

export default function StaffReviewHeader({ showSettings = false }) {
  return <AccountHeader profileRoute="StaffProfile" showSettings={showSettings} />;
}
